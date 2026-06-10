import { useEffect, useState } from 'react';
import { getAuthToken } from '../../../shared/api/api-client';
import { Profile } from '../../../shared/types/database';
import { getMe } from './auth-repository';

export function useSession() {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAuthToken()
      .then((token) => (token ? getMe() : null))
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  return { user, loading };
}
