import { createContext, useContext } from 'react';

export interface WholesalersContextType {
  isAuthenticated: boolean;
  isViewer: boolean;
  wholesalerEmail: string | null;
  twoFactorSetupRequired: boolean;
  clearTwoFactorSetupRequired: () => void;
  logIn: (email: string, password: string, code?: string) => Promise<void>;
  logOut: () => void;
}

export const WholesalersContext = createContext<WholesalersContextType | undefined>(undefined);

export const useWholesalers = (): WholesalersContextType => {
  const context = useContext(WholesalersContext);
  if (!context) {
    throw new Error('useWholesalers must be used within a WholesalersProvider');
  }
  return context;
};
