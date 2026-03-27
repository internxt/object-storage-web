import { useState } from 'react';
import { DotsThree } from '@phosphor-icons/react';
import { SubAccount } from '../services/management.service';

interface Props {
  subAccounts: SubAccount[];
  onSuspend: (id: string) => void;
  onReactivate: (id: string) => void;
  isLoading: boolean;
}

const StatusBadge = ({ status }: { status: SubAccount['status'] }) => {
  const styles: Record<SubAccount['status'], string> = {
    PAID_ACCOUNT: 'bg-green-100 text-green-700',
    ON_TRIAL: 'bg-blue-100 text-blue-700',
    SUSPENDED: 'bg-red-100 text-red-700',
  };
  const labels: Record<SubAccount['status'], string> = {
    PAID_ACCOUNT: 'Paid Account',
    ON_TRIAL: 'On Trial',
    SUSPENDED: 'Suspended',
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};

const UtilizationBar = ({
  used,
  quota,
}: {
  used?: number;
  quota?: number;
}) => {
  const pct = quota && used ? Math.min(100, (used / quota) * 100) : 0;
  return (
    <div className='flex flex-col gap-0.5 min-w-[80px]'>
      <div className='w-full bg-gray-200 rounded-full h-1.5'>
        <div className='bg-blue-500 h-1.5 rounded-full' style={{ width: `${pct}%` }} />
      </div>
      <span className='text-xs text-gray-500'>{pct.toFixed(0)}%</span>
    </div>
  );
};

const ActionsMenu = ({
  account,
  onSuspend,
  onReactivate,
}: {
  account: SubAccount;
  onSuspend: (id: string) => void;
  onReactivate: (id: string) => void;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className='relative'>
      <button
        onClick={() => setOpen((o) => !o)}
        className='p-1 rounded hover:bg-gray-100'
      >
        <DotsThree size={18} />
      </button>
      {open && (
        <div
          className='absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded shadow-md w-36 z-10'
          onBlur={() => setOpen(false)}
        >
          {account.status !== 'SUSPENDED' ? (
            <button
              onClick={() => {
                onSuspend(account.id);
                setOpen(false);
              }}
              className='block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50'
            >
              Suspend
            </button>
          ) : (
            <button
              onClick={() => {
                onReactivate(account.id);
                setOpen(false);
              }}
              className='block w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-gray-50'
            >
              Reactivate
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const formatDate = (date?: string) =>
  date ? new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export const SubAccountsTable = ({ subAccounts, onSuspend, onReactivate, isLoading }: Props) => {
  const headers = [
    'Name',
    'Account Email',
    'Channel Account',
    'Active Storage (TB)',
    'Deleted Storage (TB)',
    'Storage Utilization',
    'Creation Date',
    'Deletion Date',
    'Trial Expiration',
    'MFA',
    'Status',
    'Record Date',
    '',
  ];

  return (
    <div className='overflow-x-auto'>
      <table className='w-full text-sm text-left'>
        <thead>
          <tr className='border-b border-gray-200 bg-gray-50'>
            {headers.map((h) => (
              <th key={h} className='px-3 py-2 text-xs font-medium text-gray-500 whitespace-nowrap'>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={headers.length} className='text-center py-8 text-gray-400'>
                Loading...
              </td>
            </tr>
          ) : subAccounts.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className='text-center py-8 text-gray-400'>
                No sub-accounts found
              </td>
            </tr>
          ) : (
            subAccounts.map((acc) => (
              <tr key={acc.id} className='border-b border-gray-100 hover:bg-gray-50'>
                <td className='px-3 py-2 text-blue-600 hover:underline cursor-pointer truncate max-w-[140px]'>
                  {acc.name || acc.id}
                </td>
                <td className='px-3 py-2 text-gray-700'>{acc.email}</td>
                <td className='px-3 py-2 text-gray-500'>{acc.channelAccount || '—'}</td>
                <td className='px-3 py-2 text-gray-700'>{acc.activeStorage?.toFixed(8) ?? '—'}</td>
                <td className='px-3 py-2 text-gray-700'>{acc.deletedStorage?.toFixed(8) ?? '—'}</td>
                <td className='px-3 py-2'>
                  <UtilizationBar used={acc.activeStorage} quota={acc.storageQuotaTB} />
                </td>
                <td className='px-3 py-2 text-gray-500 whitespace-nowrap'>{formatDate(acc.creationDate)}</td>
                <td className='px-3 py-2 text-gray-500 whitespace-nowrap'>{formatDate(acc.deletionDate)}</td>
                <td className='px-3 py-2 text-gray-500 whitespace-nowrap'>{formatDate(acc.trialExpiration)}</td>
                <td className='px-3 py-2 text-gray-500'>{acc.mfa ? 'Yes' : '—'}</td>
                <td className='px-3 py-2'>
                  <StatusBadge status={acc.status} />
                </td>
                <td className='px-3 py-2 text-gray-500 whitespace-nowrap'>{formatDate(acc.recordDate)}</td>
                <td className='px-3 py-2'>
                  <ActionsMenu account={acc} onSuspend={onSuspend} onReactivate={onReactivate} />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
