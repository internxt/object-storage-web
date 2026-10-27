import { useState, ReactNode, useMemo } from 'react';
import { managementAuthService } from '../services/management-auth.service';
import { ManagementContext } from './useManagement';

export const ManagementProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!managementAuthService.getToken());

  const logIn = async (email: string, password: string, code?: string) => {
    await managementAuthService.logIn(email, password, code);
    setIsAuthenticated(true);
  };

  const logOut = () => {
    managementAuthService.logOut();
    setIsAuthenticated(false);
  };

  const value = useMemo(() => ({ isAuthenticated, logIn, logOut }), [isAuthenticated]);

  return <ManagementContext.Provider value={value}>{children}</ManagementContext.Provider>;
};
