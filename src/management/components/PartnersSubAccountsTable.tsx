import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { DotsThree } from '@phosphor-icons/react';
import { SubAccount } from '../services/management.service';
import { SubAccountsTable, ColumnDef, SortOrder } from './SubAccountsTable';

interface Props {
  subAccounts: SubAccount[];
  onSuspend: (id: string) => void;
  onReactivate: (id: string) => void;
  isLoading: boolean;
  pendingAccountId?: string | null;
  sortOrder?: SortOrder;
  onSortActiveStorage?: (order: SortOrder) => void;
}

const formatDate = (date?: string) =>
  date ? new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const formatStorage = (value?: number) => {
  if (value == null) return '—';
  if (value === 0) return <span className='text-gray-300'>0.00</span>;
  return value.toFixed(4);
};

const StatusBadge = ({ status }: { status: SubAccount['status'] }) => {
  if (!status) return null;
  const config = {
    PAID_ACCOUNT: { bg: '#f0fdf4', border: '#bbf7d0', color: '#15803d', dot: '#22c55e', label: 'Paid' },
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
      <button ref={btnRef} onClick={handleOpen} className='p-1.5 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors'>
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
              <button onClick={() => { onSuspend(account.id); setOpen(false); }} className='block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors'>
                Suspend
              </button>
            ) : (
              <button onClick={() => { onReactivate(account.id); setOpen(false); }} className='block w-full text-left px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50 transition-colors'>
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

export const PartnersSubAccountsTable = ({
  subAccounts,
  onSuspend,
  onReactivate,
  isLoading,
  pendingAccountId,
  sortOrder,
  onSortActiveStorage,
}: Props) => {
  const navigate = useNavigate();

  const columns: ColumnDef[] = [
    {
      header: 'Name',
      cell: (acc) => (
        <span
          onClick={() => navigate(`/partners/sub-accounts/${acc.id}`)}
          className='font-mono text-[11px] text-[#1e3a5f] hover:text-[#122840] underline underline-offset-2 cursor-pointer tracking-tight'
        >
          {acc.id.slice(0, 8)}…{acc.id.slice(-4)}
        </span>
      ),
    },
    {
      header: 'Account Email',
      cell: (acc) => <span className='text-gray-600 text-[13px]'>{acc.email}</span>,
    },
    {
      header: 'Active Storage (TB)',
      align: 'right',
      sortKey: 'activeStorage',
      cell: (acc) => <span className='font-mono text-[12px] text-gray-700 tabular-nums'>{formatStorage(acc.activeStorage)}</span>,
    },
    {
      header: 'Deleted Storage (TB)',
      align: 'right',
      cell: (acc) => <span className='font-mono text-[12px] text-gray-700 tabular-nums'>{formatStorage(acc.deletedStorage)}</span>,
    },
    {
      header: 'Created',
      cell: (acc) => <span className='text-[12px] text-gray-500 whitespace-nowrap'>{formatDate(acc.creationDate)}</span>,
    },
    {
      header: 'Status',
      cell: (acc) => <StatusBadge status={acc.status} />,
    },
    {
      header: '',
      align: 'right',
      cell: (acc) =>
        pendingAccountId === acc.id ? (
          <div className='w-4 h-4 border-2 border-gray-200 border-t-indigo-400 rounded-full animate-spin inline-block' />
        ) : (
          <ActionsMenu account={acc} onSuspend={onSuspend} onReactivate={onReactivate} />
        ),
    },
  ];

  return (
    <SubAccountsTable
      subAccounts={subAccounts}
      columns={columns}
      isLoading={isLoading}
      sortOrder={sortOrder}
      onSortActiveStorage={onSortActiveStorage}
    />
  );
};
