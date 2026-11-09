import { DatabaseSync } from 'node:sqlite';

export const database = new DatabaseSync('orbital.db');

database.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    username TEXT NOT NULL COLLATE NOCASE UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

    CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    expires_at INTEGER NOT NULL
  );
  
    CREATE TABLE IF NOT EXISTS saved_launches (
    user_id INTEGER NOT NULL REFERENCES users(id),
    launch_id TEXT NOT NULL,
    saved_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, launch_id)
  );

`);

console.log('Databasen är redo');