'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { api, ApiError } from './api';
import { config, isFirebaseConfigured } from './config';
import type { User } from './types';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  isFirebaseMode: boolean;
  registerWithEmail: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_STORAGE_KEY = 'carrymate_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const persistToken = (t: string | null) => {
    setToken(t);
    if (typeof window !== 'undefined') {
      if (t) localStorage.setItem(TOKEN_STORAGE_KEY, t);
      else localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  };

  const refreshProfile = useCallback(async (activeToken?: string | null) => {
    const t = activeToken ?? token;
    if (!t) {
      setUser(null);
      return;
    }
    try {
      const res = await api.post<{ data: User }>('/auth/profile', undefined, t);
      setUser(res.data);
    } catch {
      persistToken(null);
      setUser(null);
    }
  }, [token]);

  // Bootstrap: demo mode reads JWT from localStorage; Firebase mode listens for auth state changes.
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    async function bootstrap() {
      if (isFirebaseConfigured) {
        const { getFirebaseAuth } = await import('./firebaseClient');
        const { onAuthStateChanged } = await import('firebase/auth');
        const auth = getFirebaseAuth();
        unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
          if (fbUser) {
            const idToken = await fbUser.getIdToken();
            persistToken(idToken);
            await refreshProfile(idToken);
          } else {
            persistToken(null);
            setUser(null);
          }
          setLoading(false);
        });
      } else {
        const stored = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_STORAGE_KEY) : null;
        if (stored) {
          setToken(stored);
          await refreshProfile(stored);
        }
        setLoading(false);
      }
    }

    bootstrap();
    return () => unsubscribe?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const registerWithEmail = async (name: string, email: string, password: string, phone?: string) => {
    if (isFirebaseConfigured) {
      const { getFirebaseAuth } = await import('./firebaseClient');
      const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
      const auth = getFirebaseAuth();
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      const idToken = await cred.user.getIdToken();
      persistToken(idToken);
      await refreshProfile(idToken);
    } else {
      const res = await api.post<{ data: { user: User; token: string } }>('/auth/register', { name, email, password, phone });
      persistToken(res.data.token);
      setUser(res.data.user);
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    if (isFirebaseConfigured) {
      const { getFirebaseAuth } = await import('./firebaseClient');
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      const auth = getFirebaseAuth();
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await cred.user.getIdToken();
      persistToken(idToken);
      await refreshProfile(idToken);
    } else {
      const res = await api.post<{ data: { user: User; token: string } }>('/auth/login', { email, password });
      persistToken(res.data.token);
      setUser(res.data.user);
    }
  };

  const loginWithGoogle = async () => {
    if (!isFirebaseConfigured) {
      throw new ApiError(
        'Google sign-in requires Firebase to be configured on this deployment. Set the NEXT_PUBLIC_FIREBASE_* variables to enable it.',
        'FIREBASE_NOT_CONFIGURED',
        400
      );
    }
    const { getFirebaseAuth } = await import('./firebaseClient');
    const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
    const auth = getFirebaseAuth();
    const cred = await signInWithPopup(auth, new GoogleAuthProvider());
    const idToken = await cred.user.getIdToken();
    persistToken(idToken);
    await refreshProfile(idToken);
  };

  const logout = async () => {
    if (isFirebaseConfigured) {
      const { getFirebaseAuth } = await import('./firebaseClient');
      const { signOut } = await import('firebase/auth');
      await signOut(getFirebaseAuth());
    }
    persistToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isFirebaseMode: isFirebaseConfigured,
        registerWithEmail,
        loginWithEmail,
        loginWithGoogle,
        logout,
        refreshProfile: () => refreshProfile(),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export { config };
