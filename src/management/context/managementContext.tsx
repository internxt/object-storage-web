import { createContext, useState, ReactNode, useContext, useMemo } from 'react';
import { managementAuthService } from '../services/management-auth.service';

interface ManagementContextType {
  isAuthenticated: boolean;
  logIn: (email: string, password: string) => Promise<void>;
  logOut: () => void;
}

const ManagementContext = createContext<ManagementContextType | undefined>(undefined);

export const ManagementProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!managementAuthService.getToken()
  );

  const logIn = async (email: string, password: string) => {
    await managementAuthService.logIn(email, password);
    setIsAuthenticated(true);
  };

  const logOut = () => {
    managementAuthService.logOut();
    setIsAuthenticated(false);
  };

  const value = useMemo(
    () => ({ isAuthenticated, logIn, logOut }),
    [isAuthenticated]
  );

  return (
    <ManagementContext.Provider value={value}>
      {children}
    </ManagementContext.Provider>
  );
};

export const useManagement = (): ManagementContextType => {
  const context = useContext(ManagementContext);
  if (!context) {
    throw new Error('useManagement must be used within a ManagementProvider');
  }
  return context;
};
