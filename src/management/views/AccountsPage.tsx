import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { MagnifyingGlass, CaretLeft, CaretRight, FunnelSimple } from '@phosphor-icons/react';
import { managementService, SubAccount, UsagesResponse } from '../services/management.service';
import { StatsHeader } from '../components/StatsHeader';
import { SubAccountsTable } from '../components/SubAccountsTable';
import { CreateSubAccountModal } from '../components/CreateSubAccountModal';
import { DateRangePicker } from '../../components/DatePicker';
import notificationsService from '../../services/notifications.service';

const PER_PAGE = 20;
const STATUS_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Paid Account', value: 'PAID_ACCOUNT' },
  { label: 'On Trial', value: 'ON_TRIAL' },
  { label: 'Suspended', value: 'SUSPENDED' },
] as const;

export const AccountsPage = () => {
  const [usagesData, setUsagesData] = useState<UsagesResponse | null>(null);
  const [subAccounts, setSubAccounts] = useState<SubAccount[]>([]);
  const [totalSubAccounts, setTotalSubAccounts] = useState(0);
  const [page, setPage] = useState(0);
  const [searchName, setSearchName] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [isSubAccountsLoading, setIsSubAccountsLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => dayjs().format('YYYY-MM-DD'));

  useEffect(() => {
    fetchUsages();
  }, [selectedDate]);

  useEffect(() => {
    fetchSubAccounts();
  }, [page, statusFilter]);

  const fetchUsages = async () => {
    try {
      const from = dayjs(selectedDate).startOf('day').toISOString();
      const to = dayjs(selectedDate).endOf('day').toISOString();
      const data = await managementService.getUsages(from, to);
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

  // Derive control account row from usage data
  const controlAccountRow = usagesData
    ? {
        name: 'Internxt',
        email: '',
        activeStorage: (usagesData.controlAccountStorage ?? 0) * 1024,
        deletedStorage: 0,
        creationDate: '',
        recordDate: selectedDate,
      }
    : null;

  return (
    <div className='flex flex-col gap-4'>
      <StatsHeader data={usagesData} />

      {/* Date picker */}
      <div className='flex justify-end'>
        <DateRangePicker
          onApplyFilterButtonClicked={(start) => {
            setSelectedDate(dayjs(start).format('YYYY-MM-DD'));
          }}
          returnISOString={true}
        />
      </div>

      {/* My Control Account */}
      <div className='bg-white rounded border border-gray-200 p-4'>
        <h2 className='text-sm font-semibold text-gray-700 mb-3'>My Control Account</h2>
        <table className='w-full text-sm text-left'>
          <thead>
            <tr className='border-b border-gray-200'>
              {['Name', 'Account Email', 'Active Storage (TB)', 'Deleted Storage (TB)', 'Creation Date', 'Record Date'].map(
                (h) => (
                  <th key={h} className='px-3 py-2 text-xs font-medium text-gray-500'>
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {controlAccountRow ? (
              <tr className='border-b border-gray-100'>
                <td className='px-3 py-2 text-blue-600'>{controlAccountRow.name}</td>
                <td className='px-3 py-2 text-gray-500'>{controlAccountRow.email || '—'}</td>
                <td className='px-3 py-2'>{(controlAccountRow.activeStorage / 1024).toFixed(8)}</td>
                <td className='px-3 py-2'>{(controlAccountRow.deletedStorage / 1024).toFixed(8)}</td>
                <td className='px-3 py-2 text-gray-500'>{controlAccountRow.creationDate || '—'}</td>
                <td className='px-3 py-2 text-gray-500'>{controlAccountRow.recordDate}</td>
              </tr>
            ) : (
              <tr>
                <td colSpan={6} className='px-3 py-4 text-center text-gray-400'>
                  Loading...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Sub-Accounts */}
      <div className='bg-white rounded border border-gray-200 p-4'>
        <div className='flex items-center justify-between mb-3'>
          <h2 className='text-sm font-semibold text-gray-700'>Sub-Accounts</h2>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className='bg-[#5b47e0] hover:bg-[#4a38c8] text-white text-sm font-medium px-4 py-2 rounded'
          >
            Create Sub-Account
          </button>
        </div>

        <div className='flex items-center gap-2 mb-3'>
          <div className='flex items-center border border-gray-300 rounded px-2 gap-1 flex-1 max-w-xs'>
            <MagnifyingGlass size={16} className='text-gray-400' />
            <input
              type='text'
              placeholder='Search...'
              value={searchName}
              onChange={(e) => handleSearch(e.target.value)}
              className='text-sm py-1.5 outline-none flex-1'
            />
          </div>

          <div className='relative'>
            <button
              onClick={() => setFilterMenuOpen((o) => !o)}
              className='flex items-center gap-1 border border-gray-300 rounded px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50'
            >
              <FunnelSimple size={14} />
              Filter By
            </button>
            {filterMenuOpen && (
              <div className='absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded shadow-md w-40 z-10'>
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setStatusFilter(opt.value);
                      setPage(0);
                      setFilterMenuOpen(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                      statusFilter === opt.value ? 'font-medium text-blue-600' : 'text-gray-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
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
        <div className='flex items-center justify-end gap-3 mt-3'>
          <span className='text-sm text-gray-500'>
            {fromItem}-{toItem} of {totalSubAccounts}
          </span>
          <button
            disabled={!hasPrev}
            onClick={() => setPage((p) => p - 1)}
            className='p-1 disabled:opacity-40 disabled:cursor-not-allowed'
          >
            <CaretLeft size={18} className={hasPrev ? 'text-gray-700' : 'text-gray-300'} />
          </button>
          <button
            disabled={!hasNext}
            onClick={() => setPage((p) => p + 1)}
            className='p-1 disabled:opacity-40 disabled:cursor-not-allowed'
          >
            <CaretRight size={18} className={hasNext ? 'text-gray-700' : 'text-gray-300'} />
          </button>
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
