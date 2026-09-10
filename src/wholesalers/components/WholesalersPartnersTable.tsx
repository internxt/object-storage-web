import { useNavigate } from 'react-router-dom';
import { WholesalerPartner } from '../services/wholesalers.service';
import { T } from '../../sub-account/tokens';

interface Props {
  partners: WholesalerPartner[];
  isLoading: boolean;
}

const StatusBadge = ({ status }: { status: WholesalerPartner['status'] }) => {
  const config = {
    ACTIVE: { bg: '#f0fdf4', border: '#bbf7d0', color: '#15803d', dot: '#22c55e', label: 'Active' },
    DELETED: { bg: '#fef2f2', border: '#fecaca', color: '#b91c1c', dot: '#f87171', label: 'Deleted' },
  }[status];

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

const formatDate = (date?: string | null) =>
  date ? new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const formatStorage = (value?: number) => {
  if (value == null) return '—';
  if (value === 0) return <span style={{ color: T.gray80 }}>0.0000</span>;
  return value.toFixed(4);
};

const COLUMNS = [
  { header: 'Name', align: 'left' as const },
  { header: 'Email', align: 'left' as const },
  { header: 'Sub-accounts', align: 'right' as const },
  { header: 'Active Storage (TB)', align: 'right' as const },
  { header: 'Status', align: 'left' as const },
  { header: 'Created', align: 'left' as const },
];

export const WholesalersPartnersTable = ({ partners, isLoading }: Props) => {
  const navigate = useNavigate();

  return (
    <div style={{ overflowX: 'auto', position: 'relative' }}>
      <div
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          overflow: 'hidden', transition: 'opacity 300ms',
          opacity: isLoading ? 1 : 0,
        }}
      >
        <div style={{ height: '100%', background: 'rgba(0,102,255,0.3)', width: '100%' }}>
          <div className='animate-loading-bar' style={{ height: '100%', background: T.primary }} />
        </div>
      </div>

      <table style={{ width: '100%', fontSize: 14, textAlign: 'left', borderCollapse: 'separate', borderSpacing: 0 }}>
        <thead>
          <tr>
            {COLUMNS.map((col, i) => (
              <th
                key={i}
                style={{
                  padding: '12px 16px',
                  fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em',
                  color: T.gray50,
                  borderBottom: `1px solid ${T.gray15}`,
                  background: T.gray5,
                  whiteSpace: 'nowrap',
                  textAlign: col.align === 'right' ? 'right' : 'left',
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody style={{ transition: 'opacity 200ms', opacity: isLoading ? 0.4 : 1 }}>
          {partners.length === 0 && !isLoading ? (
            <tr>
              <td colSpan={COLUMNS.length} style={{ textAlign: 'center', padding: '64px 0', color: T.gray50, fontSize: 14, fontWeight: 500 }}>
                No partners found
              </td>
            </tr>
          ) : (
            partners.map((p, idx) => (
              <tr
                key={p.id}
                style={{ transition: 'background 120ms', cursor: 'pointer' }}
                onClick={() => navigate(`/wholesalers/partners/${p.id}`, { state: { partner: p } })}
                onMouseEnter={(e) => { e.currentTarget.style.background = T.gray5; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <td style={{ padding: '14px 16px', borderBottom: idx < partners.length - 1 ? `1px solid ${T.gray15}` : 'none' }}>
                  <span style={{ fontSize: 14, color: T.gray80 }}>{p.name ?? <span style={{ color: T.gray20 }}>—</span>}</span>
                </td>
                <td style={{ padding: '14px 16px', borderBottom: idx < partners.length - 1 ? `1px solid ${T.gray15}` : 'none' }}>
                  <span style={{ fontSize: 14, color: T.gray60 }}>{p.email ?? <span style={{ color: T.gray20 }}>—</span>}</span>
                </td>
                <td style={{ padding: '14px 16px', textAlign: 'right', borderBottom: idx < partners.length - 1 ? `1px solid ${T.gray15}` : 'none' }}>
                  <span style={{ fontSize: 14, color: T.gray50, fontVariantNumeric: 'tabular-nums' }}>{p.subAccountsCount}</span>
                </td>
                <td style={{ padding: '14px 16px', textAlign: 'right', borderBottom: idx < partners.length - 1 ? `1px solid ${T.gray15}` : 'none' }}>
                  <span style={{ fontSize: 14, color: T.gray80, fontVariantNumeric: 'tabular-nums' }}>{formatStorage(p.activeStorageTb)}</span>
                </td>
                <td style={{ padding: '14px 16px', borderBottom: idx < partners.length - 1 ? `1px solid ${T.gray15}` : 'none' }}>
                  <StatusBadge status={p.status} />
                </td>
                <td style={{ padding: '14px 16px', borderBottom: idx < partners.length - 1 ? `1px solid ${T.gray15}` : 'none' }}>
                  <span style={{ fontSize: 14, color: T.gray50, whiteSpace: 'nowrap' }}>{formatDate(p.createdAt)}</span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
