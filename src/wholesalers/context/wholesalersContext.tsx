import { createContext, useState, ReactNode, useContext, useMemo, useEffect } from 'react';
import { wholesalersAuthService } from '../services/wholesalers-auth.service';
import { wholesalersService } from '../services/wholesalers.service';

interface WholesalersContextType {
  isAuthenticated: boolean;
  isViewer: boolean;
  wholesalerEmail: string | null;
  twoFactorSetupRequired: boolean;
  clearTwoFactorSetupRequired: () => void;
  logIn: (email: string, password: string, code?: string) => Promise<void>;
  logOut: () => void;
}

const WholesalersContext = createContext<WholesalersContextType | undefined>(undefined);

export const WholesalersProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!wholesalersAuthService.getToken());
  const [isViewer, setIsViewer] = useState(() => wholesalersAuthService.getRole() === 'member');
  const [wholesalerEmail, setWholesalerEmail] = useState<string | null>(null);
  const [twoFactorSetupRequired, setTwoFactorSetupRequired] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
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

export const useWholesalers = (): WholesalersContextType => {
  const context = useContext(WholesalersContext);
  if (!context) {
    throw new Error('useWholesalers must be used within a WholesalersProvider');
  }
  return context;
};
