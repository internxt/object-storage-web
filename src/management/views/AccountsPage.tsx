import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { MagnifyingGlass, CaretLeft, CaretRight, FunnelSimple } from '@phosphor-icons/react';
import { managementService, SubAccount, UsagesSummary } from '../services/management.service';
import { StatsHeader } from '../components/StatsHeader';
import { SubAccountsTable } from '../components/SubAccountsTable';
import { CreateSubAccountModal } from '../components/CreateSubAccountModal';
import notificationsService from '../../services/notifications.service';

const PER_PAGE = 20;
const STATUS_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Paid Account', value: 'PAID_ACCOUNT' },
  { label: 'On Trial', value: 'ON_TRIAL' },
  { label: 'Suspended', value: 'SUSPENDED' },
] as const;

export const AccountsPage = () => {
  const [usagesData, setUsagesData] = useState<UsagesSummary | null>(null);
  const [subAccounts, setSubAccounts] = useState<SubAccount[]>([]);
  const [totalSubAccounts, setTotalSubAccounts] = useState(0);
  const [page, setPage] = useState(0);
  const [searchName, setSearchName] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [isSubAccountsLoading, setIsSubAccountsLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const selectedDate = dayjs().format('YYYY-MM-DD');

  useEffect(() => {
    fetchUsages();
  }, []);

  useEffect(() => {
    fetchSubAccounts();
  }, [page, statusFilter]);

  const fetchUsages = async () => {
    try {
      const data = await managementService.getUsagesSummary(selectedDate);
      setUsagesData(data);
    } catch (err) {
      const e = err as Error;
      notificationsService.error({ text: e.message });
    }
  };

  const fetchSubAccounts = async (name?: string) => {
    setIsSubAccountsLoading(true);
    try {
      const res = await managementService.getSubAccounts({
        page,
        perPage: PER_PAGE,
        status: statusFilter as SubAccount['status'] | undefined || undefined,
        name: name || searchName || undefined,
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
    setPage(0);
    fetchSubAccounts(value);
  };

  const handleSuspend = async (id: string) => {
    try {
      await managementService.suspendSubAccount(id);
      notificationsService.success({ text: 'Account suspended' });
      fetchSubAccounts();
    } catch (err) {
      const e = err as Error;
      notificationsService.error({ text: e.message });
    }
  };

  const handleReactivate = async (id: string) => {
    try {
      await managementService.reactivateSubAccount(id);
      notificationsService.success({ text: 'Account reactivated' });
      fetchSubAccounts();
    } catch (err) {
      const e = err as Error;
      notificationsService.error({ text: e.message });
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
      <StatsHeader data={usagesData} />

      {/* Sub-Accounts */}
      <div className='bg-white rounded-xl shadow-sm p-6'>
        <div className='flex items-center justify-between mb-5'>
          <div>
            <h2 className='text-base font-semibold text-gray-900'>Sub-Accounts</h2>
            {totalSubAccounts > 0 && (
              <p className='text-xs text-gray-400 mt-0.5'>{totalSubAccounts} accounts total</p>
            )}
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className='bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm shadow-indigo-200'
          >
            + Create Sub-Account
          </button>
        </div>

        <div className='flex items-center gap-2 mb-4'>
          <div className='flex items-center border border-gray-200 rounded-lg px-3 gap-2 flex-1 max-w-sm bg-white focus-within:border-indigo-400 transition-colors'>
            <MagnifyingGlass size={15} className='text-gray-400 flex-shrink-0' />
            <input
              type='text'
              placeholder='Search accounts…'
              value={searchName}
              onChange={(e) => handleSearch(e.target.value)}
              className='text-sm py-2 outline-none flex-1 bg-transparent text-gray-700 placeholder-gray-400'
            />
          </div>

          <div className='relative'>
            <button
              onClick={() => setFilterMenuOpen((o) => !o)}
              className={`flex items-center gap-1.5 border rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                statusFilter
                  ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <FunnelSimple size={14} />
              {statusFilter ? STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label : 'Filter'}
            </button>
            {filterMenuOpen && (
              <>
                <div className='fixed inset-0 z-10' onClick={() => setFilterMenuOpen(false)} />
                <div className='absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg w-44 z-20 overflow-hidden'>
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setStatusFilter(opt.value);
                        setPage(0);
                        setFilterMenuOpen(false);
                      }}
                      className={`flex items-center justify-between w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        statusFilter === opt.value
                          ? 'bg-indigo-50 text-indigo-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {opt.label}
                      {statusFilter === opt.value && <span className='text-indigo-500'>✓</span>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <SubAccountsTable
          subAccounts={subAccounts}
          onSuspend={handleSuspend}
          onReactivate={handleReactivate}
          isLoading={isSubAccountsLoading}
        />

        {/* Pagination */}
        <div className='flex items-center justify-between mt-4 pt-4 border-t border-gray-50'>
          <span className='text-xs text-gray-400'>
            Showing {fromItem}–{toItem} of {totalSubAccounts} accounts
          </span>
          <div className='flex items-center gap-1'>
            <button
              disabled={!hasPrev}
              onClick={() => setPage((p) => p - 1)}
              className='flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors'
            >
              <CaretLeft size={14} />
              Prev
            </button>
            <span className='px-3 py-1.5 text-sm text-gray-500'>
              {page + 1} / {Math.max(1, totalPages)}
            </span>
            <button
              disabled={!hasNext}
              onClick={() => setPage((p) => p + 1)}
              className='flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors'
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
      />
    </div>
  );
};
