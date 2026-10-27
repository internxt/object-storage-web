import { createContext, useContext } from 'react';

export interface SubAccountContextType {
  isAuthenticated: boolean;
  isAdmin: boolean;
  ssoEnabled: boolean;
  auditLogEnabled: boolean;
  memberId: string | null;
  entityId: string | null;
  partnerId: string | null;
  entityCreatedAt: string | null;
  email: string | null;
  logIn: (email: string, password: string, code?: string) => Promise<void>;
  logInWithSso: (organizationName: string) => Promise<void>;
  refreshClaims: () => void;
  logOut: () => void;
}

export const SubAccountContext = createContext<SubAccountContextType | undefined>(undefined);

export const useSubAccount = (): SubAccountContextType => {
  const context = useContext(SubAccountContext);
  if (!context) {
    throw new Error('useSubAccount must be used within a SubAccountProvider');
  }
  return context;
};
