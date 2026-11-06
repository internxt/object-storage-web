import { useState, ReactNode, useMemo, useEffect } from 'react';
import { managementAuthService } from '../services/management-auth.service';
import { managementService, ManagementMe } from '../services/management.service';
import { ManagementContext } from './useManagement';
import { ReauthDialog } from '../components/ReauthDialog';

export const ManagementProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!managementAuthService.getToken()
  );
  const [me, setMe] = useState<ManagementMe | null>(null);
  const [isMeLoading, setIsMeLoading] = useState(isAuthenticated);
  const [twoFactorSetupRequired, setTwoFactorSetupRequired] = useState(false);
  const isOwner = isAuthenticated && me?.role === 'owner';

  useEffect(() => {
    if (!isAuthenticated) return;
    managementService
      .getMe()
      .then((info) => {
        setMe(info);
        setTwoFactorSetupRequired(!!info.twoFactorSetupRequired);
      })
      .catch(() => setMe(null))
      .finally(() => setIsMeLoading(false));
  }, [isAuthenticated]);

  const logIn = async (email: string, password: string, code?: string) => {
    const { twoFactorSetupRequired } = await managementAuthService.logIn(email, password, code);
    setIsAuthenticated(true);
    setTwoFactorSetupRequired(twoFactorSetupRequired);
  };

  const logOut = () => {
    managementAuthService.logOut();
    setIsAuthenticated(false);
    setMe(null);
    setTwoFactorSetupRequired(false);
  };

  const clearTwoFactorSetupRequired = () => setTwoFactorSetupRequired(false);

  const value = useMemo(
    () => ({
      isAuthenticated,
      isOwner,
      me,
      isMeLoading,
      twoFactorSetupRequired,
      clearTwoFactorSetupRequired,
      logIn,
      logOut,
    }),
    [isAuthenticated, isOwner, me, isMeLoading, twoFactorSetupRequired]
  );

  return (
    <ManagementContext.Provider value={value}>
      {children}
      <ReauthDialog />
    </ManagementContext.Provider>
  );
};
