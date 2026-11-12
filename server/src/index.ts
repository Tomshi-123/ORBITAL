import express from 'express';
import type { Request, Response } from 'express';
import {
  createHash,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';
import { database } from './database';

const scrypt = promisify(scryptCallback);
const app = express();
const port = 3000;

app.use(express.json({ limit: '8kb' }));

app.use((request, response, next) => {
  const origin = request.headers.origin;
  if (origin && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
    response.setHeader('Access-Control-Allow-Origin', origin);
    response.setHeader('Vary', 'Origin');
  }
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  if (request.method === 'OPTIONS') {
    response.status(204).end();
    return;
  }
  next();
});

app.get('/health', (_request, response) => {
  response.json({ status: 'ok' });
});

app.post('/register', async (request, response) => {
  const { username, password } = request.body ?? {};

  if (
    typeof username !== 'string' ||
    !/^[a-zA-Z0-9_]{3,32}$/.test(username)
  ) {
    response.status(400).json({
      error: 'Användarnamnet måste vara 3–32 tecken och får innehålla bokstäver, siffror och understreck.',
    });
    return;
  }

  if (
    typeof password !== 'string' ||
    password.length < 12 ||
    password.length > 128
  ) {
    response.status(400).json({
      error: 'Lösenordet måste vara mellan 12 och 128 tecken.',
    });
    return;
  }

  const salt = randomBytes(16).toString('hex');
  const hash = (await scrypt(password, salt, 64)) as Buffer;
  const passwordHash = `${salt}:${hash.toString('hex')}`;

  const existingUser = database
    .prepare('SELECT id FROM users WHERE username = ?')
    .get(username);

  if (existingUser) {
    response.status(409).json({ error: 'Användarnamnet är redan upptaget.' });
    return;
  }

  const result = database
    .prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)')
    .run(username, passwordHash);

  response.status(201).json({
    id: Number(result.lastInsertRowid),
    username,
  });
});

app.post('/login', async (request, response) => {
  const { username, password } = request.body ?? {};

  if (
    typeof username !== 'string' ||
    !/^[a-zA-Z0-9_]{3,32}$/.test(username) ||
    typeof password !== 'string' ||
    password.length < 12 ||
    password.length > 128
  ) {
    response.status(400).json({ error: 'Ogiltiga inloggningsuppgifter.' });
    return;
  }

  let user = database
    .prepare('SELECT id, username, password_hash FROM users WHERE username = ?')
    .get(username) as { id: number; username: string; password_hash: string } | undefined;

  let created = false;
  if (!user) {
    const salt = randomBytes(16).toString('hex');
    const hash = (await scrypt(password, salt, 64)) as Buffer;
    const passwordHash = `${salt}:${hash.toString('hex')}`;
    const result = database
      .prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)')
      .run(username, passwordHash);
    user = {
      id: Number(result.lastInsertRowid),
      username,
      password_hash: passwordHash,
    };
    created = true;
  }

  if (!created) {
    const [salt, hashHex] = user.password_hash.split(':');

    if (!salt || !hashHex || !/^[0-9a-f]{128}$/.test(hashHex)) {
      throw new Error('Ogiltig lösenordshash i databasen');
    }

    const expectedHash = Buffer.from(hashHex, 'hex');
    const actualHash = (await scrypt(password, salt, 64)) as Buffer;

    if (!timingSafeEqual(expectedHash, actualHash)) {
      response.status(401).json({ error: 'Fel användarnamn eller lösenord.' });
      return;
    }
  }

  const token = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;

  database
    .prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)')
    .run(tokenHash, user.id, expiresAt);

  response.json({
    token,
    expiresAt,
    username: user.username,
    created,
  });
});

function getSessionUserId(request: Request, response: Response): number | null {
  const authorization = request.headers.authorization;
  const match = authorization?.match(/^Bearer ([0-9a-f]{64})$/);

  if (!match) {
    response.status(401).json({ error: 'Du måste vara inloggad.' });
    return null;
  }

  const tokenHash = createHash('sha256').update(match[1]).digest('hex');

  const session = database
    .prepare('SELECT user_id FROM sessions WHERE token_hash = ? AND expires_at > ?')
    .get(tokenHash, Date.now());

  if (!session || typeof session.user_id !== 'number') {
    response.status(401).json({ error: 'Inloggningen är ogiltig eller har gått ut.' });
    return null;
  }

  return session.user_id;
}

// Hämta användarens sparade uppskjutnings-ID:n.
app.get('/me/saved-launches', (request, response) => {
  const userId = getSessionUserId(request, response);
  if (userId === null) return;

  const rows = database
    .prepare('SELECT launch_id FROM saved_launches WHERE user_id = ? ORDER BY saved_at DESC')
    .all(userId);

  response.json({ launchIds: rows.map((row) => row.launch_id) });
});

// Spara ett uppskjutnings-ID.
app.post('/me/saved-launches', (request, response) => {
  const userId = getSessionUserId(request, response);
  if (userId === null) return;

  const { launchId } = request.body ?? {};

  if (typeof launchId !== 'string' || launchId.length < 1 || launchId.length > 128) {
    response.status(400).json({ error: 'Ogiltigt uppskjutnings-ID.' });
    return;
  }

  database
    .prepare('INSERT OR IGNORE INTO saved_launches (user_id, launch_id) VALUES (?, ?)')
    .run(userId, launchId);

  response.json({ message: 'Uppskjutningen är sparad.' });
});

// Ta bort ett sparat uppskjutnings-ID.
app.delete('/me/saved-launches/:launchId', (request, response) => {
  const userId = getSessionUserId(request, response);
  if (userId === null) return;

  database
    .prepare('DELETE FROM saved_launches WHERE user_id = ? AND launch_id = ?')
    .run(userId, request.params.launchId);

  response.status(204).end();
});

app.listen(port, () => {
  console.log(`Servern körs på http://localhost:${port}`);
});