import { User, userService } from '../services/user.service';
import {
  createContext,
  useState,
  ReactNode,
  useContext,
  useMemo,
  useEffect,
} from 'react';
import { localStorageService } from '../services/localStorage.service';

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

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
        const userData = await userService.getUserData();
        setUser(userData);
      } catch (error) {
        console.error('Error fetching user data:', error);
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
    [user, setUser, isLoading]
  );

  return (
    <UserContext.Provider value={memoizedUser}>{children}</UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
