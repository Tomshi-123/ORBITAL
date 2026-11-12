import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { PropsWithChildren } from 'react';
import {
  authenticate,
  clearSession,
  persistSession,
  restoreSession,
  type AuthSession,
} from '../services/auth';

type AuthContextValue = {
  session: AuthSession | null;
  loading: boolean;
  restoreError: string | null;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    restoreSession()
      .then((savedSession) => { if (active) setSession(savedSession); })
      .catch((error: unknown) => {
        console.error('Failed to restore login session', error);
        if (active) {
          setRestoreError(error instanceof Error ? error.message : 'Could not restore the saved login.');
        }
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const signIn = useCallback(async (username: string, password: string) => {
    const nextSession = await authenticate(username, password);
    await persistSession(nextSession);
    setRestoreError(null);
    setSession(nextSession);
  }, []);

  const signOut = useCallback(async () => {
    await clearSession();
    setSession(null);
  }, []);

  const value = useMemo(() => ({
    session,
    loading,
    restoreError,
    signIn,
    signOut,
  }), [session, loading, restoreError, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider.');
  return context;
}
