import { useNavigate } from 'react-router-dom';
import { Partner } from '../services/partners.service';
import { ArrowUp, ArrowDown, ArrowSquareOut } from '@phosphor-icons/react';
import { StatusBadge } from '../../components/StatusBadge';
import { T } from '../../sub-account/tokens';

export type SortOrder = 'asc' | 'desc';

interface Props {
  partners: Partner[];
  isLoading: boolean;
  sortOrder?: SortOrder;
  onSortActiveStorage?: (order: SortOrder) => void;
}

const formatDate = (date?: string | null) =>
  date ? new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const formatStorage = (value?: number) => {
  if (value == null) return '—';
  if (value === 0) return <span style={{ color: T.gray20 }}>0.0000</span>;
  return value.toFixed(4);
};

const linkStyle: React.CSSProperties = {
  fontSize: 14,
  color: T.primary,
  textDecoration: 'underline',
  textUnderlineOffset: 2,
  cursor: 'pointer',
};

const emptyValue = <span style={{ color: T.gray20, fontSize: 14 }}>—</span>;

const COL_HEADERS = [
  { label: 'ID', align: 'left' },
  { label: 'Name', align: 'left' },
  { label: 'Email', align: 'left' },
  { label: 'Sub-accounts', align: 'right' },
  { label: 'Active Storage (TB)', align: 'right' },
  { label: 'Status', align: 'left' },
  { label: 'Partner Created', align: 'left' },
  { label: 'Created', align: 'left' },
  { label: 'Stripe', align: 'left' },
] as const;

export const PartnersTable = ({ partners, isLoading, sortOrder, onSortActiveStorage }: Props) => {
  const navigate = useNavigate();

  return (
    <div style={{ overflowX: 'auto', position: 'relative' }}>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          overflow: 'hidden',
          transition: 'opacity 300ms',
          opacity: isLoading ? 1 : 0,
        }}
      >
        <div style={{ height: '100%', background: 'rgba(0,102,255,0.3)', width: '100%' }}>
          <div className="animate-loading-bar" style={{ height: '100%', background: T.primary }} />
        </div>
      </div>

      <table style={{ width: '100%', fontSize: 14, textAlign: 'left', borderCollapse: 'separate', borderSpacing: 0 }}>
        <thead>
          <tr>
            {COL_HEADERS.map((h, i) => {
              const isActiveStorage = h.label === 'Active Storage (TB)';
              return (
                <th
                  key={i}
                  onClick={
                    isActiveStorage ? () => onSortActiveStorage?.(sortOrder === 'asc' ? 'desc' : 'asc') : undefined
                  }
                  style={{
                    padding: '12px 16px',
                    fontSize: 10,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: T.gray50,
                    borderBottom: `1px solid ${T.gray15}`,
                    background: T.gray5,
                    whiteSpace: 'nowrap',
                    textAlign: h.align === 'right' ? 'right' : 'left',
                    cursor: isActiveStorage ? 'pointer' : undefined,
                    userSelect: isActiveStorage ? 'none' : undefined,
                  }}
                >
                  {isActiveStorage ? (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        justifyContent: 'flex-end',
                        width: '100%',
                      }}
                    >
                      {h.label}
                      {sortOrder === 'asc' ? (
                        <ArrowUp size={11} weight="bold" color={T.primary} />
                      ) : sortOrder === 'desc' ? (
                        <ArrowDown size={11} weight="bold" color={T.primary} />
                      ) : (
                        <ArrowUp size={11} weight="bold" color={T.gray20} />
                      )}
                    </span>
                  ) : (
                    h.label
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody style={{ transition: 'opacity 200ms', opacity: isLoading ? 0.4 : 1 }}>
          {partners.length === 0 && !isLoading ? (
            <tr>
              <td
                colSpan={COL_HEADERS.length}
                style={{ textAlign: 'center', padding: '64px 0', color: T.gray50, fontSize: 14, fontWeight: 500 }}
              >
                No partners found
              </td>
            </tr>
          ) : (
            partners.map((p, idx) => {
              const cellStyle: React.CSSProperties = {
                padding: '14px 16px',
                borderBottom: idx < partners.length - 1 ? `1px solid ${T.gray15}` : 'none',
              };
              return (
                <tr
                  key={p.id}
                  style={{ transition: 'background 120ms' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = T.gray5;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <td
                    style={cellStyle}
                    onClick={() => navigate(`/management/partners/${p.id}`, { state: { partner: p } })}
                  >
                    <span style={{ ...linkStyle, fontFamily: 'monospace', fontSize: 13, letterSpacing: '-0.01em' }}>
                      {p.storageProviderId.slice(0, 8)}…{p.storageProviderId.slice(-4)}
                    </span>
                  </td>
                  <td style={{ ...cellStyle, fontSize: 14, color: T.gray80 }}>{p.name ?? emptyValue}</td>
                  <td style={{ ...cellStyle, fontSize: 14, color: T.gray60 }}>{p.email ?? emptyValue}</td>
                  <td style={{ ...cellStyle, textAlign: 'right' }}>
                    <span style={{ fontSize: 14, color: T.gray80, fontVariantNumeric: 'tabular-nums' }}>
                      {p.subAccountsCount}
                    </span>
                  </td>
                  <td style={{ ...cellStyle, textAlign: 'right' }}>
                    <span style={{ fontSize: 14, color: T.gray80, fontVariantNumeric: 'tabular-nums' }}>
                      {formatStorage(p.activeStorageTb)}
                    </span>
                  </td>
                  <td style={cellStyle}>
                    <StatusBadge status={p.status} />
                  </td>
                  <td style={cellStyle}>
                    <span style={{ fontSize: 14, color: T.gray50, whiteSpace: 'nowrap' }}>
                      {formatDate(p.providerCreatedAt)}
                    </span>
                  </td>
                  <td style={cellStyle}>
                    <span style={{ fontSize: 14, color: T.gray50, whiteSpace: 'nowrap' }}>
                      {formatDate(p.createdAt)}
                    </span>
                  </td>
                  <td style={cellStyle}>
                    {p.customerId ? (
                      <a
                        href={`https://dashboard.stripe.com/customers/${p.customerId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{ ...linkStyle, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        View <ArrowSquareOut size={14} />
                      </a>
                    ) : (
                      emptyValue
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
