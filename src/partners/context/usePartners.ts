import { createContext, useContext } from 'react';
import { PartnerInfo } from '../services/partners.service';

export interface PartnersContextType {
  isAuthenticated: boolean;
  isViewer: boolean;
  partnerInfo: PartnerInfo | null;
  twoFactorSetupRequired: boolean;
  clearTwoFactorSetupRequired: () => void;
  logIn: (email: string, password: string, code?: string) => Promise<void>;
  logOut: () => void;
}

export const PartnersContext = createContext<PartnersContextType | undefined>(undefined);

export const usePartners = (): PartnersContextType => {
  const context = useContext(PartnersContext);
  if (!context) {
    throw new Error('usePartners must be used within a PartnersProvider');
  }
  return context;
};
