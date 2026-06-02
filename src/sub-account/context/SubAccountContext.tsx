import { createContext, useState, ReactNode, useContext, useMemo } from 'react';
import { subAccountAuthService } from '../services/sub-account-auth.service';

interface SubAccountContextType {
  isAuthenticated: boolean;
  isAdmin: boolean;
  memberId: string | null;
  entityId: string | null;
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
  const [memberId, setMemberId] = useState(
    () => subAccountAuthService.getMemberId(),
  );
  const [entityId, setEntityId] = useState(
    () => subAccountAuthService.getEntityId(),
  );

  const logIn = async (email: string, password: string) => {
    await subAccountAuthService.logIn(email, password);
    console.log('[sub-account] context: logIn done, setting isAuthenticated=true');
    setIsAuthenticated(true);
    setIsAdmin(subAccountAuthService.getRole() === 'admin');
    setMemberId(subAccountAuthService.getMemberId());
    setEntityId(subAccountAuthService.getEntityId());
  };

  const logOut = () => {
    subAccountAuthService.logOut();
    setIsAuthenticated(false);
    setIsAdmin(false);
    setMemberId(null);
    setEntityId(null);
  };

  const value = useMemo(
    () => ({ isAuthenticated, isAdmin, memberId, entityId, logIn, logOut }),
    [isAuthenticated, isAdmin, memberId, entityId],
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
