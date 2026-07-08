import { createContext, useState, ReactNode, useContext, useMemo } from 'react';
import { subAccountAuthService } from '../services/sub-account-auth.service';

interface SubAccountContextType {
  isAuthenticated: boolean;
  isAdmin: boolean;
  ssoEnabled: boolean;
  memberId: string | null;
  entityId: string | null;
  partnerId: string | null;
  entityCreatedAt: string | null;
  email: string | null;
  logIn: (email: string, password: string) => Promise<void>;
  logOut: () => void;
}

const SubAccountContext = createContext<SubAccountContextType | undefined>(undefined);

export const SubAccountProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!subAccountAuthService.getToken(),
  );
  const [isAdmin, setIsAdmin] = useState(
    () => subAccountAuthService.getRole() === 'admin',
  );
  const [ssoEnabled, setSsoEnabled] = useState(
    () => subAccountAuthService.getSsoEnabled(),
  );
  const [memberId, setMemberId] = useState(
    () => subAccountAuthService.getMemberId(),
  );
  const [entityId, setEntityId] = useState(
    () => subAccountAuthService.getEntityId(),
  );
  const [partnerId, setPartnerId] = useState(
    () => subAccountAuthService.getPartnerId(),
  );
  const [entityCreatedAt, setEntityCreatedAt] = useState(
    () => subAccountAuthService.getEntityCreatedAt(),
  );
  const [email, setEmail] = useState(
    () => subAccountAuthService.getEmail(),
  );

  const logIn = async (email: string, password: string) => {
    await subAccountAuthService.logIn(email, password);
    console.log('[sub-account] context: logIn done, setting isAuthenticated=true');
    setIsAuthenticated(true);
    setIsAdmin(subAccountAuthService.getRole() === 'admin');
    setSsoEnabled(subAccountAuthService.getSsoEnabled());
    setMemberId(subAccountAuthService.getMemberId());
    setEntityId(subAccountAuthService.getEntityId());
    setPartnerId(subAccountAuthService.getPartnerId());
    setEntityCreatedAt(subAccountAuthService.getEntityCreatedAt());
    setEmail(subAccountAuthService.getEmail());
  };

  const logOut = () => {
    subAccountAuthService.logOut();
    setIsAuthenticated(false);
    setIsAdmin(false);
    setSsoEnabled(false);
    setMemberId(null);
    setEntityId(null);
    setPartnerId(null);
    setEntityCreatedAt(null);
    setEmail(null);
  };

  const value = useMemo(
    () => ({ isAuthenticated, isAdmin, ssoEnabled, memberId, entityId, partnerId, entityCreatedAt, email, logIn, logOut }),
    [isAuthenticated, isAdmin, ssoEnabled, memberId, entityId, partnerId, entityCreatedAt, email],
  );

  return <SubAccountContext.Provider value={value}>{children}</SubAccountContext.Provider>;
};

export const useSubAccount = (): SubAccountContextType => {
  const context = useContext(SubAccountContext);
  if (!context) {
    throw new Error('useSubAccount must be used within a SubAccountProvider');
  }
  return context;
};
