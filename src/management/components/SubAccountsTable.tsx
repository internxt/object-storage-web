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
  const config: Record<SubAccount['status'], { dot: string; text: string; bg: string; border: string; label: string }> = {
    PAID_ACCOUNT: { dot: 'bg-emerald-400', text: 'text-emerald-800', bg: 'bg-emerald-100', border: 'border-emerald-300', label: 'Paid' },
    ON_TRIAL:     { dot: 'bg-blue-400',    text: 'text-blue-700',    bg: 'bg-blue-50',     border: 'border-blue-200',    label: 'Trial' },
    SUSPENDED:    { dot: 'bg-red-400',     text: 'text-red-700',     bg: 'bg-red-50',      border: 'border-red-200',     label: 'Suspended' },
  };
  const { dot, text, bg, border, label } = config[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${text} ${bg} ${border}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
      {label}
    </span>
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
        className='p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors'
      >
        <DotsThree size={18} weight='bold' />
      </button>
      {open && (
        <>
          <div className='fixed inset-0 z-10' onClick={() => setOpen(false)} />
          <div className='absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg w-36 z-20 overflow-hidden'>
            {account.status !== 'SUSPENDED' ? (
              <button
                onClick={() => { onSuspend(account.id); setOpen(false); }}
                className='block w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors'
              >
                Suspend
              </button>
            ) : (
              <button
                onClick={() => { onReactivate(account.id); setOpen(false); }}
                className='block w-full text-left px-4 py-2.5 text-sm text-emerald-600 hover:bg-emerald-50 transition-colors'
              >
                Reactivate
              </button>
            )}
          </div>
        </>
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
    'Created',
    'Deleted',
    'Status',
    '',
  ];

  return (
    <div className='overflow-x-auto rounded-lg border border-gray-100'>
      <table className='w-full text-sm text-left'>
        <thead>
          <tr className='bg-gradient-to-r from-[#060e5c] to-[#0d2aad]'>
            {headers.map((h, i) => (
              <th
                key={`${h}-${i}`}
                className='px-4 py-3 text-xs font-semibold text-blue-100 whitespace-nowrap uppercase tracking-wider first:rounded-tl-lg last:rounded-tr-lg'
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className='divide-y divide-gray-100 bg-white'>
          {isLoading ? (
            <tr className='bg-white'>
              <td colSpan={headers.length} className='text-center py-12'>
                <div className='flex flex-col items-center gap-2 text-gray-400'>
                  <div className='w-5 h-5 border-2 border-gray-300 border-t-indigo-500 rounded-full animate-spin' />
                  <span className='text-sm'>Loading accounts…</span>
                </div>
              </td>
            </tr>
          ) : subAccounts.length === 0 ? (
            <tr className='bg-white'>
              <td colSpan={headers.length} className='text-center py-12 text-gray-400 text-sm'>
                No sub-accounts found
              </td>
            </tr>
          ) : (
            subAccounts.map((acc) => (
              <tr key={acc.id} className='bg-white hover:bg-indigo-50/40 transition-colors group'>
                <td className='px-4 py-3 font-medium text-indigo-600 hover:text-indigo-800 cursor-pointer truncate max-w-[140px]'>
                  {acc.name || (
                    <span className='font-mono text-xs text-gray-500'>{acc.id.slice(0, 12)}…</span>
                  )}
                </td>
                <td className='px-4 py-3 text-gray-700'>{acc.email}</td>
                <td className='px-4 py-3 text-gray-400'>{acc.channelAccount || '—'}</td>
                <td className='px-4 py-3 text-gray-700 font-mono text-xs'>{acc.activeStorage?.toFixed(8) ?? '—'}</td>
                <td className='px-4 py-3 text-gray-700 font-mono text-xs'>{acc.deletedStorage?.toFixed(8) ?? '—'}</td>
                <td className='px-4 py-3 text-gray-500 whitespace-nowrap text-xs'>{formatDate(acc.creationDate)}</td>
                <td className='px-4 py-3 text-gray-400 whitespace-nowrap text-xs'>{formatDate(acc.deletionDate)}</td>
                <td className='px-4 py-3'>
                  <StatusBadge status={acc.status} />
                </td>
                <td className='px-4 py-3 opacity-0 group-hover:opacity-100 transition-opacity'>
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
