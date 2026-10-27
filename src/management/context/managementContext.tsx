import { useState, ReactNode, useMemo, useEffect } from 'react';
import { managementAuthService } from '../services/management-auth.service';
import { managementService, ManagementRole } from '../services/management.service';
import { ManagementContext } from './useManagement';

export const ManagementProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!managementAuthService.getToken());
  const [role, setRole] = useState<ManagementRole | null>(null);
  const isSuperadmin = isAuthenticated && role === 'superadmin';

  useEffect(() => {
    if (!isAuthenticated) return;
    managementService
      .getMe()
      .then((me) => setRole(me.role))
      .catch(() => setRole(null));
  }, [isAuthenticated]);

  const logIn = async (email: string, password: string, code?: string) => {
    await managementAuthService.logIn(email, password, code);
    setIsAuthenticated(true);
  };

  const logOut = () => {
    managementAuthService.logOut();
    setIsAuthenticated(false);
    setRole(null);
  };

  const value = useMemo(() => ({ isAuthenticated, isSuperadmin, logIn, logOut }), [isAuthenticated, isSuperadmin]);

  return <ManagementContext.Provider value={value}>{children}</ManagementContext.Provider>;
};
