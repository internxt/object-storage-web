import { ArrowSquareOut } from '@phosphor-icons/react';
import { Wholesaler } from '../services/wholesalers.service';
import { T } from '../../sub-account/tokens';

interface Props {
  wholesalers: Wholesaler[];
  isLoading: boolean;
}

const formatDate = (date?: string | null) =>
  date ? new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const linkStyle: React.CSSProperties = {
  fontSize: 14,
  color: T.primary,
  textDecoration: 'underline',
  textUnderlineOffset: 2,
  cursor: 'pointer',
};

const COLUMNS = [
  { header: 'Name', align: 'left' as const },
  { header: 'Email', align: 'left' as const },
  { header: 'Partners', align: 'right' as const },
  { header: 'Created', align: 'left' as const },
  { header: 'Stripe', align: 'left' as const },
];

export const WholesalersTable = ({ wholesalers, isLoading }: Props) => {
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
          {wholesalers.length === 0 && !isLoading ? (
            <tr>
              <td colSpan={COLUMNS.length} style={{ textAlign: 'center', padding: '64px 0', color: T.gray50, fontSize: 14, fontWeight: 500 }}>
                No wholesalers found
              </td>
            </tr>
          ) : (
            wholesalers.map((w, idx) => (
              <tr
                key={w.id}
                style={{ transition: 'background 120ms' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = T.gray5; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <td style={{ padding: '14px 16px', borderBottom: idx < wholesalers.length - 1 ? `1px solid ${T.gray15}` : 'none' }}>
                  <span style={{ fontSize: 14, color: T.gray80 }}>{w.name}</span>
                </td>
                <td style={{ padding: '14px 16px', borderBottom: idx < wholesalers.length - 1 ? `1px solid ${T.gray15}` : 'none' }}>
                  <span style={{ fontSize: 14, color: T.gray60 }}>{w.email}</span>
                </td>
                <td style={{ padding: '14px 16px', textAlign: 'right', borderBottom: idx < wholesalers.length - 1 ? `1px solid ${T.gray15}` : 'none' }}>
                  <span style={{ fontSize: 14, color: T.gray80, fontVariantNumeric: 'tabular-nums' }}>{w.partnersCount}</span>
                </td>
                <td style={{ padding: '14px 16px', borderBottom: idx < wholesalers.length - 1 ? `1px solid ${T.gray15}` : 'none' }}>
                  <span style={{ fontSize: 14, color: T.gray50, whiteSpace: 'nowrap' }}>{formatDate(w.createdAt)}</span>
                </td>
                <td style={{ padding: '14px 16px', borderBottom: idx < wholesalers.length - 1 ? `1px solid ${T.gray15}` : 'none' }}>
                  {w.customerId ? (
                    <a
                      href={`https://dashboard.stripe.com/customers/${w.customerId}`}
                      target='_blank'
                      rel='noopener noreferrer'
                      style={{ ...linkStyle, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      View <ArrowSquareOut size={14} />
                    </a>
                  ) : (
                    <span style={{ color: T.gray20, fontSize: 14 }}>—</span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
