import { useState, ReactNode, useMemo, useEffect } from 'react';
import { managementAuthService } from '../services/management-auth.service';
import { managementService, ManagementMe, isElevatedRole } from '../services/management.service';
import { ManagementContext } from './useManagement';

export const ManagementProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!managementAuthService.getToken()
  );
  const [me, setMe] = useState<ManagementMe | null>(null);
  const isSuperadmin = isAuthenticated && isElevatedRole(me?.role);
  const isOwner = isAuthenticated && me?.role === 'owner';

  useEffect(() => {
    if (!isAuthenticated) return;
    managementService
      .getMe()
      .then(setMe)
      .catch(() => setMe(null));
  }, [isAuthenticated]);

  const logIn = async (email: string, password: string, code?: string) => {
    await managementAuthService.logIn(email, password, code);
    setIsAuthenticated(true);
  };

  const logOut = () => {
    managementAuthService.logOut();
    setIsAuthenticated(false);
    setMe(null);
  };

  const value = useMemo(
    () => ({ isAuthenticated, isSuperadmin, isOwner, me, logIn, logOut }),
    [isAuthenticated, isSuperadmin, isOwner, me]
  );

  return <ManagementContext.Provider value={value}>{children}</ManagementContext.Provider>;
};
