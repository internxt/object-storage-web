import { createContext, useState, ReactNode, useContext, useMemo } from 'react';
import { wholesalersAuthService } from '../services/wholesalers-auth.service';

interface WholesalersContextType {
  isAuthenticated: boolean;
  wholesalerEmail: string | null;
  logIn: (email: string, password: string) => Promise<void>;
  logOut: () => void;
}

const WholesalersContext = createContext<WholesalersContextType | undefined>(undefined);

export const WholesalersProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!wholesalersAuthService.getToken());
  const [wholesalerEmail, setWholesalerEmail] = useState<string | null>(
    () => wholesalersAuthService.getPayload()?.email ?? null,
  );

  const logIn = async (email: string, password: string) => {
    await wholesalersAuthService.logIn(email, password);
    setIsAuthenticated(true);
    setWholesalerEmail(wholesalersAuthService.getPayload()?.email ?? null);
  };

  const logOut = () => {
    wholesalersAuthService.logOut();
    setIsAuthenticated(false);
    setWholesalerEmail(null);
  };

  const value = useMemo(
    () => ({ isAuthenticated, wholesalerEmail, logIn, logOut }),
    [isAuthenticated, wholesalerEmail],
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
