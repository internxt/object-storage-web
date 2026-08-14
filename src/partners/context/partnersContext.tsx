import { createContext, useState, ReactNode, useContext, useMemo, useEffect } from 'react';
import { partnersAuthService } from '../services/partners-auth.service';
import { partnersService, PartnerInfo } from '../services/partners.service';

interface PartnersContextType {
  isAuthenticated: boolean;
  isViewer: boolean;
  partnerInfo: PartnerInfo | null;
  logIn: (email: string, password: string, code?: string) => Promise<void>;
  logOut: () => void;
}

const PartnersContext = createContext<PartnersContextType | undefined>(undefined);

export const PartnersProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!partnersAuthService.getToken()
  );
  const [isViewer, setIsViewer] = useState(
    () => partnersAuthService.getRole() === 'member'
  );
  const [partnerInfo, setPartnerInfo] = useState<PartnerInfo | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setPartnerInfo(null);
      return;
    }
    partnersService
      .getMe()
      .then(setPartnerInfo)
      .catch(() => setPartnerInfo(null));
  }, [isAuthenticated]);

  const logIn = async (email: string, password: string, code?: string) => {
    await partnersAuthService.logIn(email, password, code);
    setIsAuthenticated(true);
    setIsViewer(partnersAuthService.getRole() === 'member');
  };

  const logOut = () => {
    partnersAuthService.logOut();
    setIsAuthenticated(false);
    setIsViewer(false);
    setPartnerInfo(null);
  };

  const value = useMemo(
    () => ({ isAuthenticated, isViewer, partnerInfo, logIn, logOut }),
    [isAuthenticated, isViewer, partnerInfo]
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
