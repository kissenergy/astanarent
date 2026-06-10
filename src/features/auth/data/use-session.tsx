import { PropsWithChildren, createContext, useContext, useEffect, useMemo, useState } from 'react';
import { clearAuthToken, getAuthToken } from '../../../shared/api/api-client';
import { Profile } from '../../../shared/types/database';
import { getMe, signInWithEmail, signUpWithEmail } from './auth-repository';
import { AuthFormValues } from '../domain/auth-types';

type SessionContextValue = {
  user: Profile | null;
  loading: boolean;
  refresh: () => Promise<Profile | null>;
  signIn: (values: Pick<AuthFormValues, 'phone' | 'password'>) => Promise<Profile>;
  signUp: (values: AuthFormValues) => Promise<Profile>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function AuthSessionProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const token = await getAuthToken();
    if (!token) {
      setUser(null);
      return null;
    }

    try {
      const profile = await getMe();
      setUser(profile);
      return profile;
    } catch (error) {
      await clearAuthToken();
      setUser(null);
      return null;
    }
  };

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      user,
      loading,
      refresh,
      signIn: async (values) => {
        const response = await signInWithEmail(values);
        setUser(response.user);
        return response.user;
      },
      signUp: async (values) => {
        const response = await signUpWithEmail(values);
        setUser(response.user);
        return response.user;
      },
      signOut: async () => {
        await clearAuthToken();
        setUser(null);
      },
    }),
    [user, loading],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) {
    throw new Error('useSession must be used inside AuthSessionProvider');
  }

  return value;
}
