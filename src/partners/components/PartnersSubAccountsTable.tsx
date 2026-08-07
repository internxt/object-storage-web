import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { DotsThree } from '@phosphor-icons/react';
import { SubAccountsTable, ColumnDef, SortOrder } from '../../components/SubAccountsTable';
import { ConfirmActionModal } from '../../management/components/ConfirmActionModal';
import { T, shadow } from '../../styles/tokens';
import { SubAccount } from '../../types/subAccount';

interface Props {
  subAccounts: SubAccount[];
  onSuspend: (id: string) => void;
  onReactivate: (id: string) => void;
  isLoading: boolean;
  pendingAccountId?: string | null;
  sortOrder?: SortOrder;
  onSortActiveStorage?: (order: SortOrder) => void;
  readOnly?: boolean;
}

const formatDate = (date?: string) =>
  date ? new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const formatStorage = (value?: number) => {
  if (value == null) return '—';
  if (value === 0) return <span style={{ color: T.gray80 }}>0.00</span>;
  return value.toFixed(4);
};

const QUOTA_WARNING_PCT = 80;

const StorageQuotaCell = ({ used, quota }: { used?: number; quota?: number | null }) => {
  if (quota == null) return <span style={{ fontSize: 13, color: T.gray50 }}>No limit</span>;

  const pct = quota > 0 ? ((used ?? 0) / quota) * 100 : 0;
  const color = pct >= 100 ? T.red : pct >= QUOTA_WARNING_PCT ? '#d97706' : T.primary;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 104 }}>
      <div style={{ width: '100%', height: 6, borderRadius: 999, background: T.gray15, overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', borderRadius: 999, background: color }} />
      </div>
      <span style={{ fontSize: 12, color: T.gray50, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
        {(used ?? 0).toFixed(2)} / {quota} TB · <span style={{ color, fontWeight: 500 }}>{pct.toFixed(0)}%</span>
      </span>
    </div>
  );
};

const StatusBadge = ({ status }: { status: SubAccount['status'] }) => {
  if (!status) return null;
  const config = {
    PAID_ACCOUNT: { bg: '#f0fdf4', border: '#bbf7d0', color: '#15803d', dot: '#22c55e', label: 'Paid' },
    SUSPENDED:    { bg: '#f4f4f5', border: '#d4d4d8', color: '#52525b', dot: '#a1a1aa', label: 'Suspended' },
    DELETED:      { bg: '#fef2f2', border: '#fecaca', color: '#b91c1c', dot: '#f87171', label: 'Deleted' },
  }[status];
  if (!config) return <span style={{ fontSize: 12, color: T.gray50 }}>{status}</span>;
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontSize: 11, fontWeight: 600, letterSpacing: '0.02em',
        padding: '4px 10px', borderRadius: 999, border: '1px solid',
        background: config.bg, borderColor: config.border, color: config.color,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: config.dot }} />
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
  const [confirmAction, setConfirmAction] = useState<'suspend' | 'reactivate' | null>(null);
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

  const handleConfirm = () => {
    if (confirmAction === 'suspend') onSuspend(account.id);
    else if (confirmAction === 'reactivate') onReactivate(account.id);
    setConfirmAction(null);
  };

  return (
    <div>
      <button
        ref={btnRef}
        onClick={handleOpen}
        style={{ padding: 6, borderRadius: 8, color: T.gray50, background: 'transparent', border: 'none', cursor: 'pointer' }}
        onMouseEnter={(e) => { e.currentTarget.style.color = T.gray80; e.currentTarget.style.background = T.gray10; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = T.gray50; e.currentTarget.style.background = 'transparent'; }}
      >
        <DotsThree size={17} weight='bold' />
      </button>
      {open && createPortal(
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setOpen(false)} />
          <div
            style={{
              position: 'fixed', top: coords.top, right: coords.right,
              background: T.white, border: `1px solid ${T.gray15}`, borderRadius: 12,
              boxShadow: shadow.lg, width: 144, zIndex: 50, overflow: 'hidden', padding: '4px 0',
            }}
          >
            {account.status !== 'SUSPENDED' ? (
              <button
                onClick={() => { setConfirmAction('suspend'); setOpen(false); }}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 16px', fontSize: 14, color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#fef2f2'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                Suspend
              </button>
            ) : (
              <button
                onClick={() => { setConfirmAction('reactivate'); setOpen(false); }}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 16px', fontSize: 14, color: '#059669', background: 'transparent', border: 'none', cursor: 'pointer' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#ecfdf5'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                Reactivate
              </button>
            )}
          </div>
        </>,
        document.body,
      )}
      <ConfirmActionModal
        isOpen={confirmAction === 'suspend'}
        title='Suspend account?'
        description='This will suspend the account and block access. You can reactivate it at any time.'
        confirmLabel='Suspend'
        variant='danger'
        onConfirm={handleConfirm}
        onCancel={() => setConfirmAction(null)}
      />
      <ConfirmActionModal
        isOpen={confirmAction === 'reactivate'}
        title='Reactivate account?'
        description='This will restore access to the account.'
        confirmLabel='Reactivate'
        variant='success'
        onConfirm={handleConfirm}
        onCancel={() => setConfirmAction(null)}
      />
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
  readOnly = false,
}: Props) => {
  const navigate = useNavigate();

  const linkStyle: React.CSSProperties = {
    fontSize: 13, color: T.primary, textDecoration: 'underline', textUnderlineOffset: 2, cursor: 'pointer',
  };

  const columns: ColumnDef[] = [
    {
      header: 'Name',
      cell: (acc) => (
        <span
          onClick={() => navigate(`/partners/sub-accounts/${acc.id}`)}
          style={{ ...linkStyle, fontFamily: 'monospace', letterSpacing: '-0.01em' }}
        >
          {acc.id.slice(0, 8)}…{acc.id.slice(-4)}
        </span>
      ),
    },
    {
      header: 'Account Email',
      cell: (acc) => <span style={{ color: T.gray60, fontSize: 14 }}>{acc.email}</span>,
    },
    {
      header: 'Active Storage (TB)',
      align: 'right',
      sortKey: 'activeStorage',
      cell: (acc) => <span style={{ fontSize: 14, color: T.gray80, fontVariantNumeric: 'tabular-nums' }}>{formatStorage(acc.activeStorage)}</span>,
    },
    {
      header: 'Deleted Storage (TB)',
      align: 'right',
      cell: (acc) => <span style={{ fontSize: 14, color: T.gray80, fontVariantNumeric: 'tabular-nums' }}>{formatStorage(acc.deletedStorage)}</span>,
    },
    {
      header: 'Storage Quota',
      cell: (acc) => <StorageQuotaCell used={acc.activeStorage} quota={acc.storageQuotaTb} />,
    },
    {
      header: 'Created',
      cell: (acc) => <span style={{ fontSize: 14, color: T.gray50, whiteSpace: 'nowrap' }}>{formatDate(acc.creationDate)}</span>,
    },
    {
      header: 'Status',
      cell: (acc) => <StatusBadge status={acc.status} />,
    },
    ...(!readOnly ? [{
      header: '',
      align: 'right' as const,
      cell: (acc: SubAccount) =>
        pendingAccountId === acc.id ? (
          <div
            className='animate-spin'
            style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${T.gray20}`, borderTopColor: T.primary, display: 'inline-block' }}
          />
        ) : (
          <ActionsMenu account={acc} onSuspend={onSuspend} onReactivate={onReactivate} />
        ),
    }] : []),
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
