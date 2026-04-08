import { createContext, useState, ReactNode, useContext, useMemo } from 'react';
import { partnersAuthService } from '../services/partners-auth.service';

interface PartnersContextType {
  isAuthenticated: boolean;
  logIn: (email: string, password: string) => Promise<void>;
  logOut: () => void;
}

const PartnersContext = createContext<PartnersContextType | undefined>(undefined);

export const PartnersProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!partnersAuthService.getToken()
  );

  const logIn = async (email: string, password: string) => {
    await partnersAuthService.logIn(email, password);
    setIsAuthenticated(true);
  };

  const logOut = () => {
    partnersAuthService.logOut();
    setIsAuthenticated(false);
  };

  const value = useMemo(
    () => ({ isAuthenticated, logIn, logOut }),
    [isAuthenticated]
  );

  return (
    <PartnersContext.Provider value={value}>
      {children}
    </PartnersContext.Provider>
  );
};

export const usePartners = (): PartnersContextType => {
  const context = useContext(PartnersContext);
  if (!context) {
    throw new Error('usePartners must be used within a PartnersProvider');
  }
  return context;
};
