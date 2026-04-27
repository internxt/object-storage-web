import { useEffect, useState } from 'react';
import { MagnifyingGlass, CaretLeft, CaretRight } from '@phosphor-icons/react';
import { partnersService, PartnersUsageSummary } from '../services/partners.service';
import { SubAccount } from '../../management/services/management.service';
import { PartnersSubAccountsTable } from '../../management/components/PartnersSubAccountsTable';
import { SortOrder } from '../../management/components/SubAccountsTable';
import { CreateSubAccountModal } from '../../management/components/CreateSubAccountModal';
import notificationsService from '../../services/notifications.service';
import { usePartners } from '../context/partnersContext';

const PER_PAGE = 20;

export const PartnersSubAccountsPage = () => {
  const { isViewer } = usePartners();
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

  const handleCreate = async (dto: Parameters<typeof partnersService.createSubAccount>[0]) => {
    await partnersService.createSubAccount(dto);
    notificationsService.success({ text: 'Sub-account created' });
    setPage(0);
    fetchSubAccounts();
    fetchUsageSummary();
  };

  const totalPages = Math.ceil(total / PER_PAGE);
  const fromItem = total === 0 ? 0 : page * PER_PAGE + 1;
  const toItem = Math.min((page + 1) * PER_PAGE, total);

  return (
    <div className='flex flex-col gap-5'>
      {/* Stats */}
      {usageSummary && (
        <div
          className='bg-white rounded-2xl overflow-hidden'
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' }}
        >
          <div className='px-10 pt-9 pb-3'>
            <p className='text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400'>Storage Overview</p>
          </div>
          <div className='px-10 pb-9 flex items-center gap-0'>
            <div className='flex flex-col gap-2 flex-1'>
              <p className='text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400'>Active Storage</p>
              <div className='flex items-baseline gap-2'>
                <span className='text-5xl font-semibold tracking-tight leading-none' style={{ color: '#6366f1' }}>
                  {usageSummary.activeStorageTb.toFixed(2)}
                </span>
                <span className='text-xl font-medium text-gray-400'>TB</span>
              </div>
            </div>
            <div className='w-px bg-gray-100 self-stretch mx-10' />
            <div className='flex flex-col gap-2 flex-1'>
              <p className='text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400'>Sub-Accounts</p>
              <div className='flex items-baseline gap-2'>
                <span className='text-5xl font-semibold tracking-tight leading-none' style={{ color: '#10b981' }}>
                  {usageSummary.totalSubAccounts}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className='bg-white rounded-xl shadow-sm p-6'>
        <div className='flex items-center justify-between mb-5'>
          <div>
            <h2 className='text-base font-semibold text-gray-900'>Sub-Accounts</h2>
            {total > 0 && <p className='text-xs text-gray-400 mt-0.5'>{total} accounts total</p>}
          </div>
          {!isViewer && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className='bg-indigo hover:bg-indigo-dark active:bg-indigo-dark text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm'
            >
              Create Sub-Account
            </button>
          )}
        </div>

        <div className='flex items-center gap-2 mb-4'>
          <div className='flex items-center border border-gray-200 rounded-lg px-3 gap-2 flex-1 max-w-sm bg-white focus-within:border-indigo transition-colors'>
            <MagnifyingGlass size={15} className='text-gray-400 flex-shrink-0' />
            <input
              type='text'
              placeholder='Search by email…'
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              className='text-sm py-2 outline-none flex-1 bg-transparent text-gray-700 placeholder-gray-400'
            />
          </div>
        </div>

        <PartnersSubAccountsTable
          subAccounts={subAccounts}
          onSuspend={handleSuspend}
          onReactivate={handleReactivate}
          isLoading={isLoading}
          pendingAccountId={pendingAccountId}
          sortOrder={activeStorageSortOrder}
          onSortActiveStorage={(order: SortOrder) => { setPage(0); setActiveStorageSortOrder(order); }}
          readOnly={isViewer}
        />

        <div className='flex items-center justify-between mt-4 pt-4 border-t border-gray-50'>
          <span className='text-xs text-gray-400'>
            Showing {fromItem}–{toItem} of {total} accounts
          </span>
          <div className='flex items-center gap-1'>
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className='flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors'
            >
              <CaretLeft size={14} /> Prev
            </button>
            <span className='px-3 py-1.5 text-sm text-gray-500'>
              {page + 1} / {Math.max(1, totalPages)}
            </span>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className='flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors'
            >
              Next <CaretRight size={14} />
            </button>
          </div>
        </div>
      </div>

      <CreateSubAccountModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
};
