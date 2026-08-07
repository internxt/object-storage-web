import { useEffect, useState } from 'react';
import { MagnifyingGlass, CaretLeft, CaretRight, FunnelSimple } from '@phosphor-icons/react';
import { managementService, SubAccount, UsagesSummary } from '../services/management.service';
import { StatsHeader } from '../components/StatsHeader';
import { ManagementSubAccountsTable } from '../components/ManagementSubAccountsTable';
import { SortOrder } from '../components/SubAccountsTable';
import { CreateSubAccountModal } from '../components/CreateSubAccountModal';
import notificationsService from '../../services/notifications.service';
import { T, card, shadow } from '../../styles/tokens';
import { resolveConsoleUrl } from '../../utils/consoleUrl';

const PER_PAGE = 20;
const STATUS_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Paid Account', value: 'PAID_ACCOUNT' },
  { label: 'Suspended', value: 'SUSPENDED' },
] as const;

export const AccountsPage = () => {
  const [usagesData, setUsagesData] = useState<UsagesSummary | null>(null);
  const [topClient, setTopClient] = useState<SubAccount | null>(null);
  const [subAccounts, setSubAccounts] = useState<SubAccount[]>([]);
  const [totalSubAccounts, setTotalSubAccounts] = useState(0);
  const [page, setPage] = useState(0);
  const [searchName, setSearchName] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [isSubAccountsLoading, setIsSubAccountsLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeStorageSortOrder, setActiveStorageSortOrder] = useState<SortOrder | undefined>('desc');
  const [pendingAccountId, setPendingAccountId] = useState<string | null>(null);
  useEffect(() => {
    fetchUsages();
  }, []);

  useEffect(() => {
    fetchSubAccounts();
  }, [page, statusFilter, activeStorageSortOrder]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0);
      fetchSubAccounts();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchName]);

  const fetchUsages = async () => {
    try {
      const [data, top] = await Promise.all([
        managementService.getUsagesSummary(),
        managementService.getSubAccounts({ page: 0, perPage: 1, sortBy: 'activeStorage', sortOrder: 'desc' }),
      ]);
      setUsagesData(data);
      setTopClient(top.subAccounts[0] ?? null);
    } catch (err) {
      const e = err as Error;
      notificationsService.error({ text: e.message });
    }
  };

  const fetchSubAccounts = async () => {
    setIsSubAccountsLoading(true);
    try {
      const res = await managementService.getSubAccounts({
        page,
        perPage: PER_PAGE,
        status: statusFilter as SubAccount['status'] | undefined || undefined,
        name: searchName || undefined,
        sortBy: activeStorageSortOrder ? 'activeStorage' : undefined,
        sortOrder: activeStorageSortOrder,
      });
      setSubAccounts(res.subAccounts ?? []);
      setTotalSubAccounts(res.total ?? 0);
    } catch (err) {
      const e = err as Error;
      notificationsService.error({ text: e.message });
    } finally {
      setIsSubAccountsLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchName(value);
  };

  const handleSuspend = async (id: string) => {
    setPendingAccountId(id);
    try {
      await managementService.suspendSubAccount(id);
      notificationsService.success({ text: 'Account suspended' });
      fetchSubAccounts();
    } catch (err) {
      const e = err as Error;
      notificationsService.error({ text: e.message });
    } finally {
      setPendingAccountId(null);
    }
  };

  const handleReactivate = async (id: string) => {
    setPendingAccountId(id);
    try {
      await managementService.reactivateSubAccount(id);
      notificationsService.success({ text: 'Account reactivated' });
      fetchSubAccounts();
    } catch (err) {
      const e = err as Error;
      notificationsService.error({ text: e.message });
    } finally {
      setPendingAccountId(null);
    }
  };

  const handleCreateSubAccount = async (dto: Parameters<typeof managementService.createSubAccount>[0]) => {
    await managementService.createSubAccount(dto);
    notificationsService.success({ text: 'Sub-account created' });
    setPage(0);
    fetchSubAccounts();
  };

  const totalPages = Math.ceil(totalSubAccounts / PER_PAGE);
  const hasPrev = page > 0;
  const hasNext = page < totalPages - 1;
  const fromItem = totalSubAccounts === 0 ? 0 : page * PER_PAGE + 1;
  const toItem = Math.min((page + 1) * PER_PAGE, totalSubAccounts);


  return (
    <div className='flex flex-col gap-5'>
      <StatsHeader data={usagesData} topClient={topClient} />

      {/* Sub-Accounts */}
      <div style={{ ...card, borderRadius: 16, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: T.gray100, margin: 0 }}>Sub-Accounts</h2>
            {totalSubAccounts > 0 && (
              <p style={{ fontSize: 13, color: T.gray50, margin: '2px 0 0' }}>{totalSubAccounts} accounts total</p>
            )}
          </div>
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
              placeholder='Search accounts…'
              value={searchName}
              onChange={(e) => handleSearch(e.target.value)}
              style={{
                fontSize: 14, padding: '8px 0', outline: 'none', flex: 1,
                background: 'transparent', color: T.gray80, border: 'none',
              }}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setFilterMenuOpen((o) => !o)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                height: 40, padding: '0 12px',
                border: `1px solid ${statusFilter ? T.primary : T.gray20}`,
                borderRadius: 8, cursor: 'pointer',
                fontSize: 14, fontWeight: 500,
                background: statusFilter ? T.primaryBg : T.white,
                color: statusFilter ? T.primary : T.gray60,
              }}
            >
              <FunnelSimple size={14} />
              {statusFilter ? STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label : 'Filter'}
            </button>
            {filterMenuOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setFilterMenuOpen(false)} />
                <div
                  style={{
                    position: 'absolute', left: 0, top: 'calc(100% + 4px)',
                    background: T.white, border: `1px solid ${T.gray20}`, borderRadius: 8,
                    boxShadow: shadow.lg, width: 176, zIndex: 20, overflow: 'hidden',
                  }}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setStatusFilter(opt.value);
                        setPage(0);
                        setFilterMenuOpen(false);
                      }}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        width: '100%', textAlign: 'left', padding: '10px 16px',
                        fontSize: 14, border: 'none', cursor: 'pointer',
                        background: statusFilter === opt.value ? T.primaryBg : 'transparent',
                        color: statusFilter === opt.value ? T.primary : T.gray80,
                        fontWeight: statusFilter === opt.value ? 500 : 400,
                      }}
                      onMouseEnter={(e) => { if (statusFilter !== opt.value) e.currentTarget.style.background = T.gray5; }}
                      onMouseLeave={(e) => { if (statusFilter !== opt.value) e.currentTarget.style.background = 'transparent'; }}
                    >
                      {opt.label}
                      {statusFilter === opt.value && <span style={{ color: T.primary }}>✓</span>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <ManagementSubAccountsTable
          subAccounts={subAccounts}
          onSuspend={handleSuspend}
          onReactivate={handleReactivate}
          isLoading={isSubAccountsLoading}
          pendingAccountId={pendingAccountId}
          sortOrder={activeStorageSortOrder}
          onSortActiveStorage={(order: SortOrder) => { setPage(0); setActiveStorageSortOrder(order); }}
        />

        {/* Pagination */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 16, borderTop: `1px solid ${T.gray15}` }}>
          <span style={{ fontSize: 13, color: T.gray50 }}>
            Showing {fromItem}–{toItem} of {totalSubAccounts} accounts
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
        onSubmit={handleCreateSubAccount}
        consoleUrl={resolveConsoleUrl(new Date())}
      />
    </div>
  );
};
