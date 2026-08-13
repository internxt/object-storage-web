import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSubAccount } from '../context/SubAccountContext';
import { useSubAccountBranding } from '../context/SubAccountBrandingContext/useSubAccountBranding';
import { ConsoleTopBar } from './ConsoleTopBar';
import { subAccountBillingService } from '../services/sub-account-billing.service';
import notificationsService from '../../services/notifications.service';
import { T } from '../tokens';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';

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
  const { branding, styles, isLoading } = useSubAccountBranding();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [billingLoading, setBillingLoading] = useState(false);

  const tabs = isAdmin ? TABS_ADMIN : TABS_MEMBER;

  const activeTab = tabs.find(t => pathname.startsWith(t.key))?.key ?? tabs[0].key;

  if (isLoading) return <SubAccountConsoleSkeleton />;

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
    <div style={{ ...styles, display: 'flex', flexDirection: 'column', minHeight: '100vh', background: T.gray5 }}>
      <ConsoleTopBar
        tabs={tabs}
        activeTab={activeTab}
        onTab={(key) => navigate(key)}
        consoleLabel="Cloud account"
        logoUrl={branding.logoUrl}
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

export function SubAccountConsoleSkeleton() {
  return (
    <SkeletonTheme baseColor={T.gray15} highlightColor={T.gray10}>
    <div aria-busy='true' aria-label='Loading console branding' className='min-h-screen' style={{ background: T.gray5 }}>
      <header className='h-14 px-8 flex items-center justify-between' style={{ background: T.white, borderBottom: `1px solid ${T.gray20}` }}>
        <Skeleton height={18} width={132} />
        <div className='flex items-center gap-6'>
          <Skeleton height={16} width={58} />
          <Skeleton height={16} width={48} />
          <Skeleton circle height={30} width={30} />
        </div>
      </header>
      <main className='max-w-[1200px] mx-auto px-7 py-8 flex flex-col gap-4'>
        <div className='flex gap-4'>
          {[0, 1, 2].map((index) => (
            <div key={index} className='flex-1 rounded-xl p-5 flex flex-col gap-3' style={{ background: T.white, border: `1px solid ${T.gray20}` }}>
              <Skeleton height={12} width={88} />
              <Skeleton height={30} width={64} />
              <Skeleton height={12} width={120} />
            </div>
          ))}
        </div>
        <div className='rounded-xl overflow-hidden' style={{ background: T.white, border: `1px solid ${T.gray20}` }}>
          <div className='p-6 flex justify-between items-center'>
            <div className='flex flex-col gap-2'>
              <Skeleton height={18} width={88} />
              <Skeleton height={14} width={128} />
            </div>
            <Skeleton height={40} width={148} borderRadius={8} />
          </div>
          <div className='h-10 px-6 flex items-center gap-20' style={{ background: T.gray5, borderTop: `1px solid ${T.gray20}`, borderBottom: `1px solid ${T.gray20}` }}>
            <Skeleton height={10} width={64} />
            <Skeleton height={10} width={64} />
            <Skeleton height={10} width={64} />
          </div>
          <div className='p-6 flex flex-col gap-4'>
            {[0, 1, 2].map((index) => <Skeleton key={index} height={28} />)}
          </div>
        </div>
      </main>
    </div>
    </SkeletonTheme>
  );
}
