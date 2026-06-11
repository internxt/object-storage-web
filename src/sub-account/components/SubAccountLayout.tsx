import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSubAccount } from '../context/SubAccountContext';
import { ConsoleTopBar } from './ConsoleTopBar';

const TABS_ADMIN = [
  { key: '/subaccount/buckets', label: 'Buckets' },
  { key: '/subaccount/usage',   label: 'Usage' },
];

const TABS_MEMBER = [
  { key: '/subaccount/buckets', label: 'Buckets' },
];

const toInitials = (email: string | null): string => {
  if (!email) return 'SA';
  const [local] = email.split('@');
  const parts = local.split(/[._-]/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return local.slice(0, 2).toUpperCase();
};

export const SubAccountLayout = ({ children }: { children: ReactNode }) => {
  const { logOut, isAdmin, email } = useSubAccount();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const tabs = isAdmin ? TABS_ADMIN : TABS_MEMBER;

  const activeTab = tabs.find(t => pathname.startsWith(t.key))?.key ?? tabs[0].key;

  const handleLogOut = () => {
    logOut();
    navigate('/subaccount/login');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--gray-5,#F9F9FC)' }}>
      <ConsoleTopBar
        tabs={tabs}
        activeTab={activeTab}
        onTab={(key) => navigate(key)}
        consoleLabel="Sub-account"
        onSettings={() => navigate('/subaccount/settings')}
        onLogout={handleLogOut}
        user={{ email: email ?? undefined, initials: toInitials(email) }}
      />
      <main style={{ flex: 1, padding: '24px 28px', overflow: 'auto' }}>
        {children}
      </main>
    </div>
  );
};
