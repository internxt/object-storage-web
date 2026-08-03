import { useEffect, useState } from 'react';
import { MagnifyingGlass, CaretLeft, CaretRight } from '@phosphor-icons/react';
import { partnersService, PartnersUsageSummary } from '../services/partners.service';
import { resolveConsoleUrl } from '../../utils/consoleUrl';
import { SubAccount } from '../../management/services/management.service';
import { PartnersSubAccountsTable } from '../../management/components/PartnersSubAccountsTable';
import { SortOrder } from '../../management/components/SubAccountsTable';
import { CreateSubAccountModal } from '../../management/components/CreateSubAccountModal';
import notificationsService from '../../services/notifications.service';
import { usePartners } from '../context/partnersContext';
import { T, card } from '../../sub-account/tokens';

const ACCENT = '#6366f1';
const POSITIVE = '#10b981';

const labelStyle = {
  fontSize: 10, fontWeight: 600, textTransform: 'uppercase' as const,
  letterSpacing: '0.14em', color: T.gray60,
};

const metricStyle = {
  fontSize: 48, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1,
};

const unitStyle = { fontSize: 20, fontWeight: 500, color: T.gray50 };

const PER_PAGE = 20;

export const PartnersSubAccountsPage = () => {
  const { isViewer, partnerInfo } = usePartners();
  const [usageSummary, setUsageSummary] = useState<PartnersUsageSummary | null>(null);
  const [subAccounts, setSubAccounts] = useState<SubAccount[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [searchEmail, setSearchEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeStorageSortOrder, setActiveStorageSortOrder] = useState<SortOrder | undefined>('desc');
  const [pendingAccountId, setPendingAccountId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsageSummary();
  }, []);

  useEffect(() => {
    fetchSubAccounts();
  }, [page, activeStorageSortOrder]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0);
      fetchSubAccounts();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchEmail]);

  const fetchUsageSummary = async () => {
    try {
      const data = await partnersService.getUsageSummary();
      setUsageSummary(data);
    } catch (err) {
      notificationsService.error({ text: (err as Error).message });
    }
  };
  const fetchSubAccounts = async () => {
    setIsLoading(true);
    try {
      const res = await partnersService.getSubAccounts({
        page,
        perPage: PER_PAGE,
        email: searchEmail || undefined,
        sortBy: activeStorageSortOrder ? 'activeStorage' : undefined,
        sortOrder: activeStorageSortOrder,
      });
      setSubAccounts(res.subAccounts);
      setTotal(res.total);
    } catch (err) {
      notificationsService.error({ text: (err as Error).message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuspend = async (id: string) => {
    setPendingAccountId(id);
    try {
      await partnersService.suspendSubAccount(id);
      notificationsService.success({ text: 'Account suspended' });
      fetchSubAccounts();
    } catch (err) {
      notificationsService.error({ text: (err as Error).message });
    } finally {
      setPendingAccountId(null);
    }
  };

  const handleReactivate = async (id: string) => {
    setPendingAccountId(id);
    try {
      await partnersService.reactivateSubAccount(id);
      notificationsService.success({ text: 'Account reactivated' });
      fetchSubAccounts();
    } catch (err) {
      notificationsService.error({ text: (err as Error).message });
    } finally {
      setPendingAccountId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setPendingAccountId(id);
    try {
      await partnersService.deleteSubAccount(id);
      notificationsService.success({ text: 'Account deleted' });
      fetchSubAccounts();
    } catch (err) {
      notificationsService.error({ text: (err as Error).message });
    } finally {
      setPendingAccountId(null);
    }
  };

  const handleCreate = async (dto: Parameters<typeof partnersService.createSubAccount>[0]) => {
    await partnersService.createSubAccount(dto);
    notificationsService.success({ text: 'Sub-account created' });
    setPage(0);
    fetchSubAccounts();
    fetchUsageSummary();
  };

  const consoleUrl = resolveConsoleUrl(partnerInfo?.createdAt ?? null);

  const totalPages = Math.ceil(total / PER_PAGE);
  const fromItem = total === 0 ? 0 : page * PER_PAGE + 1;
  const toItem = Math.min((page + 1) * PER_PAGE, total);

  const hasPrev = page > 0;
  const hasNext = page < totalPages - 1;

  return (
    <div className='flex flex-col gap-5'>
      {/* Stats */}
      {usageSummary && (
        <div style={{ ...card, borderRadius: 16, display: 'flex' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, padding: '28px 40px' }}>
            <p style={labelStyle}>Active Storage</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ ...metricStyle, color: ACCENT }}>{usageSummary.activeStorageTb.toFixed(2)}</span>
              <span style={unitStyle}>TB</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, padding: '28px 40px', borderLeft: `1px solid ${T.gray20}` }}>
            <p style={labelStyle}>Sub-Accounts</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ ...metricStyle, color: POSITIVE }}>{usageSummary.totalSubAccounts}</span>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ ...card, borderRadius: 16, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: T.gray100, margin: 0 }}>Sub-Accounts</h2>
            {total > 0 && (
              <p style={{ fontSize: 13, color: T.gray50, margin: '2px 0 0' }}>{total} accounts total</p>
            )}
          </div>
          {!isViewer && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                height: 40, padding: '0 18px',
                background: T.primary, color: T.white,
                border: 'none', borderRadius: 8, cursor: 'pointer',
                fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap',
              }}
            >
              Create Sub-Account
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              border: `1px solid ${T.gray20}`, borderRadius: 8,
              padding: '0 12px', flex: 1, maxWidth: 384,
              background: T.white,
            }}
          >
            <MagnifyingGlass size={15} color={T.gray50} style={{ flexShrink: 0 }} />
            <input
              type='text'
              placeholder='Search by email…'
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              style={{
                fontSize: 14, padding: '8px 0', outline: 'none', flex: 1,
                background: 'transparent', color: T.gray80, border: 'none',
              }}
            />
          </div>
        </div>

        <PartnersSubAccountsTable
          subAccounts={subAccounts}
          onSuspend={handleSuspend}
          onReactivate={handleReactivate}
          onDelete={handleDelete}
          isLoading={isLoading}
          pendingAccountId={pendingAccountId}
          sortOrder={activeStorageSortOrder}
          onSortActiveStorage={(order: SortOrder) => { setPage(0); setActiveStorageSortOrder(order); }}
          readOnly={isViewer}
        />

        {/* Pagination */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 16, borderTop: `1px solid ${T.gray15}` }}>
          <span style={{ fontSize: 13, color: T.gray50 }}>
            Showing {fromItem}–{toItem} of {total} accounts
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              disabled={!hasPrev}
              onClick={() => setPage((p) => p - 1)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                height: 32, padding: '0 12px',
                fontSize: 13, fontWeight: 500, color: T.gray80,
                border: `1px solid ${T.gray20}`, borderRadius: 8,
                background: T.white, cursor: hasPrev ? 'pointer' : 'not-allowed',
                opacity: hasPrev ? 1 : 0.4,
              }}
            >
              <CaretLeft size={14} />
              Prev
            </button>
            <span style={{ padding: '0 8px', fontSize: 13, color: T.gray50 }}>
              {page + 1} / {Math.max(1, totalPages)}
            </span>
            <button
              disabled={!hasNext}
              onClick={() => setPage((p) => p + 1)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                height: 32, padding: '0 12px',
                fontSize: 13, fontWeight: 500, color: T.gray80,
                border: `1px solid ${T.gray20}`, borderRadius: 8,
                background: T.white, cursor: hasNext ? 'pointer' : 'not-allowed',
                opacity: hasNext ? 1 : 0.4,
              }}
            >
              Next
              <CaretRight size={14} />
            </button>
          </div>
        </div>
      </div>

      <CreateSubAccountModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreate}
        consoleUrl={consoleUrl}
        showNameField={false}
      />
    </div>
  );
};
