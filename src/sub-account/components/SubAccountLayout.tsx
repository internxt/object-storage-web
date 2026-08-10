import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSubAccount } from '../context/SubAccountContext';
import { ConsoleTopBar } from './ConsoleTopBar';
import { subAccountBillingService } from '../services/sub-account-billing.service';
import notificationsService from '../../services/notifications.service';
import { T } from '../tokens';

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
  const { logOut, isAdmin, email, entityId, partnerId } = useSubAccount();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [billingLoading, setBillingLoading] = useState(false);

  const tabs = isAdmin ? TABS_ADMIN : TABS_MEMBER;

  const activeTab = tabs.find(t => pathname.startsWith(t.key))?.key ?? tabs[0].key;

  const handleLogOut = () => {
    logOut();
    navigate('/subaccount/login');
  };

  const openBilling = async () => {
    if (!entityId) return;
    setBillingLoading(true);
    try {
      const { url } = await subAccountBillingService.createBillingPortalSession(entityId);
      window.open(url, '_blank');
    } catch {
      notificationsService.error({ text: 'Failed to open billing portal' });
    } finally {
      setBillingLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: T.gray5 }}>
      <ConsoleTopBar
        tabs={tabs}
        activeTab={activeTab}
        onTab={(key) => navigate(key)}
        consoleLabel="Cloud account"
        onSettings={() => navigate('/subaccount/settings')}
        onLogout={handleLogOut}
        user={{ email: email ?? undefined, initials: toInitials(email) }}
        billing={isAdmin && !partnerId ? { loading: billingLoading, onClick: openBilling } : undefined}
      />
      <main style={{ flex: 1, padding: '24px 28px', overflow: 'auto' }}>
        {children}
      </main>
    </div>
  );
};
