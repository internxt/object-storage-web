import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { DotsThree } from '@phosphor-icons/react';
import { SubAccount } from '../services/management.service';

interface Props {
  subAccounts: SubAccount[];
  onSuspend: (id: string) => void;
  onReactivate: (id: string) => void;
  isLoading: boolean;
}

const StatusBadge = ({ status }: { status: SubAccount['status'] }) => {
  if (!status) return null;

  const config = {
    PAID_ACCOUNT: { bg: '#f0fdf4', border: '#bbf7d0', color: '#15803d', dot: '#22c55e', label: 'Paid' },
    ON_TRIAL:     { bg: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8', dot: '#60a5fa', label: 'Trial' },
    SUSPENDED:    { bg: '#fef2f2', border: '#fecaca', color: '#b91c1c', dot: '#f87171', label: 'Suspended' },
  }[status];

  if (!config) return <span className='text-xs text-gray-400'>{status}</span>;

  return (
    <span
      className='inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border tracking-wide'
      style={{ background: config.bg, borderColor: config.border, color: config.color }}
    >
      <span className='w-1.5 h-1.5 rounded-full flex-shrink-0' style={{ background: config.dot }} />
      {config.label}
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
  const [coords, setCoords] = useState({ top: 0, right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleOpen = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setCoords({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    setOpen((o) => !o);
  };

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  return (
    <div>
      <button
        ref={btnRef}
        onClick={handleOpen}
        className='p-1.5 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors'
      >
        <DotsThree size={17} weight='bold' />
      </button>
      {open && createPortal(
        <>
          <div className='fixed inset-0 z-40' onClick={() => setOpen(false)} />
          <div
            className='fixed bg-white border border-gray-100 rounded-xl shadow-xl w-36 z-50 overflow-hidden py-1'
            style={{ top: coords.top, right: coords.right, boxShadow: '0 8px 30px rgba(0,0,0,0.10)' }}
          >
            {account.status !== 'SUSPENDED' ? (
              <button
                onClick={() => { onSuspend(account.id); setOpen(false); }}
                className='block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors'
              >
                Suspend
              </button>
            ) : (
              <button
                onClick={() => { onReactivate(account.id); setOpen(false); }}
                className='block w-full text-left px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50 transition-colors'
              >
                Reactivate
              </button>
            )}
          </div>
        </>,
        document.body,
      )}
    </div>
  );
};

const formatDate = (date?: string) =>
  date ? new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const formatStorage = (value?: number) => {
  if (value == null) return '—';
  if (value === 0) return <span className='text-gray-300'>0.00</span>;
  return value.toFixed(4);
};

const COL_HEADERS = [
  { label: 'Name', align: 'left' },
  { label: 'Account Email', align: 'left' },
  { label: 'Channel Account', align: 'left' },
  { label: 'Active Storage (TB)', align: 'right' },
  { label: 'Deleted Storage (TB)', align: 'right' },
  { label: 'Created', align: 'left' },
  { label: 'Deleted', align: 'left' },
  { label: 'Status', align: 'left' },
  { label: '', align: 'right' },
] as const;

export const SubAccountsTable = ({ subAccounts, onSuspend, onReactivate, isLoading }: Props) => {
  const navigate = useNavigate();

  return (
    <div className='overflow-x-auto'>
      <table className='w-full text-sm text-left border-separate border-spacing-0'>
        <thead>
          <tr>
            {COL_HEADERS.map((h, i) => (
              <th
                key={i}
                className={`px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-400 border-b border-gray-100 bg-white whitespace-nowrap ${h.align === 'right' ? 'text-right' : ''}`}
              >
                {h.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={COL_HEADERS.length} className='text-center py-16'>
                <div className='flex flex-col items-center gap-2.5 text-gray-300'>
                  <div className='w-5 h-5 border-2 border-gray-200 border-t-indigo-400 rounded-full animate-spin' />
                  <span className='text-xs font-medium'>Loading accounts…</span>
                </div>
              </td>
            </tr>
          ) : subAccounts.length === 0 ? (
            <tr>
              <td colSpan={COL_HEADERS.length} className='text-center py-16 text-gray-300 text-sm font-medium'>
                No sub-accounts found
              </td>
            </tr>
          ) : (
            subAccounts.map((acc, idx) => (
              <tr
                key={acc.id}
                className='group hover:bg-gray-50/80 transition-colors cursor-default'
              >
                {/* Name / ID */}
                <td
                  className={`px-4 py-3.5 ${idx < subAccounts.length - 1 ? 'border-b border-gray-50' : ''}`}
                  onClick={() => navigate(`/management/accounts/${acc.id}`)}
                >
                  <span className='font-mono text-[11px] text-indigo-500 hover:text-indigo-700 cursor-pointer tracking-tight'>
                    {acc.id.slice(0, 8)}…{acc.id.slice(-4)}
                  </span>
                </td>

                {/* Email */}
                <td className={`px-4 py-3.5 text-gray-600 text-[13px] ${idx < subAccounts.length - 1 ? 'border-b border-gray-50' : ''}`}>
                  {acc.email}
                </td>

                {/* Channel Account */}
                <td className={`px-4 py-3.5 text-gray-300 text-[13px] ${idx < subAccounts.length - 1 ? 'border-b border-gray-50' : ''}`}>
                  {acc.channelAccount || '—'}
                </td>

                {/* Active Storage */}
                <td className={`px-4 py-3.5 text-right font-mono text-[12px] text-gray-700 tabular-nums ${idx < subAccounts.length - 1 ? 'border-b border-gray-50' : ''}`}>
                  {formatStorage(acc.activeStorage)}
                </td>

                {/* Deleted Storage */}
                <td className={`px-4 py-3.5 text-right font-mono text-[12px] text-gray-700 tabular-nums ${idx < subAccounts.length - 1 ? 'border-b border-gray-50' : ''}`}>
                  {formatStorage(acc.deletedStorage)}
                </td>

                {/* Created */}
                <td className={`px-4 py-3.5 text-[12px] text-gray-500 whitespace-nowrap ${idx < subAccounts.length - 1 ? 'border-b border-gray-50' : ''}`}>
                  {formatDate(acc.creationDate)}
                </td>

                {/* Deleted */}
                <td className={`px-4 py-3.5 text-[12px] text-gray-300 whitespace-nowrap ${idx < subAccounts.length - 1 ? 'border-b border-gray-50' : ''}`}>
                  {formatDate(acc.deletionDate)}
                </td>

                {/* Status */}
                <td className={`px-4 py-3.5 ${idx < subAccounts.length - 1 ? 'border-b border-gray-50' : ''}`}>
                  <StatusBadge status={acc.status} />
                </td>

                {/* Actions */}
                <td className={`px-3 py-3.5 text-right ${idx < subAccounts.length - 1 ? 'border-b border-gray-50' : ''}`}>
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
