import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export type AuthSession = {
  token: string;
  expiresAt: number;
  username: string;
};

const SESSION_KEY = 'orbital.auth.session';
const host = Constants.expoConfig?.hostUri?.replace(/^[a-z]+:\/\//i, '').split(':')[0];
export const API_BASE_URL = Platform.OS === 'web'
  ? 'http://localhost:3000'
  : `http://${host ?? 'localhost'}:3000`;

async function requestError(response: Response): Promise<Error> {
  const payload = await response.json() as { error?: unknown };
  return new Error(typeof payload.error === 'string' ? payload.error : `Request failed (${response.status})`);
}

export async function authenticate(username: string, password: string): Promise<AuthSession> {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!response.ok) throw await requestError(response);
  return response.json() as Promise<AuthSession>;
}

export async function restoreSession(): Promise<AuthSession | null> {
  const saved = Platform.OS === 'web'
    ? window.localStorage.getItem(SESSION_KEY)
    : await SecureStore.getItemAsync(SESSION_KEY);
  if (!saved) return null;

  const session = JSON.parse(saved) as AuthSession;
  if (
    typeof session.token !== 'string' ||
    typeof session.username !== 'string' ||
    typeof session.expiresAt !== 'number'
  ) {
    throw new Error('The saved login session is invalid.');
  }
  if (session.expiresAt <= Date.now()) {
    await clearSession();
    return null;
  }
  return session;
}

export async function persistSession(session: AuthSession): Promise<void> {
  const value = JSON.stringify(session);
  if (Platform.OS === 'web') {
    window.localStorage.setItem(SESSION_KEY, value);
    return;
  }
  await SecureStore.setItemAsync(SESSION_KEY, value);
}

export async function clearSession(): Promise<void> {
  if (Platform.OS === 'web') {
    window.localStorage.removeItem(SESSION_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(SESSION_KEY);
}

async function authorizedRequest(path: string, token: string, init?: RequestInit): Promise<Response> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...init?.headers,
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) throw await requestError(response);
  return response;
}

export async function getSavedLaunchIds(token: string): Promise<string[]> {
  const response = await authorizedRequest('/me/saved-launches', token);
  const payload = await response.json() as { launchIds?: unknown };
  if (!Array.isArray(payload.launchIds) || !payload.launchIds.every((id) => typeof id === 'string')) {
    throw new Error('Unexpected response when loading tracked launches.');
  }
  return payload.launchIds;
}

export async function addSavedLaunch(token: string, launchId: string): Promise<void> {
  await authorizedRequest('/me/saved-launches', token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ launchId }),
  });
}

export async function removeSavedLaunch(token: string, launchId: string): Promise<void> {
  await authorizedRequest(`/me/saved-launches/${encodeURIComponent(launchId)}`, token, {
    method: 'DELETE',
  });
}
