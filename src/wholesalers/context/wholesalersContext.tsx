import { createContext, useState, ReactNode, useContext, useMemo, useEffect } from 'react';
import { wholesalersAuthService } from '../services/wholesalers-auth.service';
import { wholesalersService } from '../services/wholesalers.service';

interface WholesalersContextType {
  isAuthenticated: boolean;
  isViewer: boolean;
  wholesalerEmail: string | null;
  logIn: (email: string, password: string, code?: string) => Promise<void>;
  logOut: () => void;
}

const WholesalersContext = createContext<WholesalersContextType | undefined>(undefined);

export const WholesalersProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!wholesalersAuthService.getToken());
  const [isViewer, setIsViewer] = useState(() => wholesalersAuthService.getRole() === 'member');
  const [wholesalerEmail, setWholesalerEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setWholesalerEmail(null);
      return;
    }
    wholesalersService
      .getMe()
      .then((profile) => setWholesalerEmail(profile.email))
      .catch(() => setWholesalerEmail(null));
  }, [isAuthenticated]);

  const logIn = async (email: string, password: string, code?: string) => {
    await wholesalersAuthService.logIn(email, password, code);
    setIsAuthenticated(true);
    setIsViewer(wholesalersAuthService.getRole() === 'member');
  };

  const logOut = () => {
    wholesalersAuthService.logOut();
    setIsAuthenticated(false);
    setIsViewer(false);
    setWholesalerEmail(null);
  };

  const value = useMemo(
    () => ({ isAuthenticated, isViewer, wholesalerEmail, logIn, logOut }),
    [isAuthenticated, isViewer, wholesalerEmail],
  );

  return <WholesalersContext.Provider value={value}>{children}</WholesalersContext.Provider>;
};

export const useWholesalers = (): WholesalersContextType => {
  const context = useContext(WholesalersContext);
  if (!context) {
    throw new Error('useWholesalers must be used within a WholesalersProvider');
  }
  return context;
};
