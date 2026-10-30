import { createContext, useContext } from 'react';
import { ManagementMe } from '../services/management.service';

export interface ManagementContextType {
  isAuthenticated: boolean;
  isOwner: boolean;
  me: ManagementMe | null;
  logIn: (email: string, password: string, code?: string) => Promise<void>;
  logOut: () => void;
}

export const ManagementContext = createContext<ManagementContextType | undefined>(undefined);

export const useManagement = (): ManagementContextType => {
  const context = useContext(ManagementContext);
  if (!context) {
    throw new Error('useManagement must be used within a ManagementProvider');
  }
  return context;
};
