import { User } from '../services/user.service';
import { useState, ReactNode, useMemo, useEffect } from 'react';
import { localStorageService } from '../services/localStorage.service';
import { UserContext } from './useUser';

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);

      const token = localStorageService.getUserToken();
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        // TODO: Temporarily commented out
        // const userData = await userService.getUserData();
        // setUser(userData);
        setUser({
          email: 'authenticated-user',
          id: 'temp-id',
          usage: 0,
        });
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  const memoizedUser = useMemo(
    () => ({
      user,
      setUser,
      isLoading,
      isAuthenticated: !!user,
    }),
    [user, setUser, isLoading],
  );

  return <UserContext.Provider value={memoizedUser}>{children}</UserContext.Provider>;
};
