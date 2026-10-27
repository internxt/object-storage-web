import { useState, ReactNode, useMemo, useEffect } from 'react';
import { wholesalersAuthService } from '../services/wholesalers-auth.service';
import { wholesalersService } from '../services/wholesalers.service';
import { WholesalersContext } from './useWholesalers';

export const WholesalersProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!wholesalersAuthService.getToken());
  const [isViewer, setIsViewer] = useState(() => wholesalersAuthService.getRole() === 'member');
  const [wholesalerEmail, setWholesalerEmail] = useState<string | null>(null);
  const [twoFactorSetupRequired, setTwoFactorSetupRequired] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setWholesalerEmail(null);
      return;
    }
    wholesalersService
      .getMe()
      .then((profile) => {
        setWholesalerEmail(profile.email);
        setTwoFactorSetupRequired(!!profile.twoFactorSetupRequired);
      })
      .catch(() => setWholesalerEmail(null));
  }, [isAuthenticated]);

  const logIn = async (email: string, password: string, code?: string) => {
    const { twoFactorSetupRequired } = await wholesalersAuthService.logIn(email, password, code);
    setIsAuthenticated(true);
    setIsViewer(wholesalersAuthService.getRole() === 'member');
    setTwoFactorSetupRequired(twoFactorSetupRequired);
  };

  const logOut = () => {
    wholesalersAuthService.logOut();
    setIsAuthenticated(false);
    setIsViewer(false);
    setWholesalerEmail(null);
    setTwoFactorSetupRequired(false);
  };

  const clearTwoFactorSetupRequired = () => setTwoFactorSetupRequired(false);

  const value = useMemo(
    () => ({
      isAuthenticated,
      isViewer,
      wholesalerEmail,
      twoFactorSetupRequired,
      clearTwoFactorSetupRequired,
      logIn,
      logOut,
    }),
    [isAuthenticated, isViewer, wholesalerEmail, twoFactorSetupRequired],
  );

  return <WholesalersContext.Provider value={value}>{children}</WholesalersContext.Provider>;
};
