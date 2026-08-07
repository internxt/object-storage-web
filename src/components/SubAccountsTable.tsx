import { ReactNode } from 'react';
import { ArrowUp, ArrowDown } from '@phosphor-icons/react';
import { T } from '../styles/tokens';
import { SubAccount } from '../types/subAccount';

export type SortOrder = 'asc' | 'desc';

export interface ColumnDef {
  header: ReactNode;
  align?: 'left' | 'right';
  sortKey?: 'activeStorage';
  cell: (acc: SubAccount, isLast: boolean) => ReactNode;
}

interface Props {
  subAccounts: SubAccount[];
  columns: ColumnDef[];
  isLoading: boolean;
  sortOrder?: SortOrder;
  onSortActiveStorage?: (order: SortOrder) => void;
}

export const SubAccountsTable = ({ subAccounts, columns, isLoading, sortOrder, onSortActiveStorage }: Props) => {
  const handleActiveStorageSort = () => {
    onSortActiveStorage?.(sortOrder === 'asc' ? 'desc' : 'asc');
  };

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
            {columns.map((col, i) => {
              const isSortable = !!col.sortKey;
              return (
                <th
                  key={i}
                  onClick={isSortable ? handleActiveStorageSort : undefined}
                  style={{
                    padding: '12px 16px',
                    fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em',
                    color: T.gray50,
                    borderBottom: `1px solid ${T.gray15}`,
                    background: T.gray5,
                    whiteSpace: 'nowrap',
                    textAlign: col.align === 'right' ? 'right' : 'left',
                    cursor: isSortable ? 'pointer' : undefined,
                    userSelect: isSortable ? 'none' : undefined,
                  }}
                >
                  {isSortable ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', width: '100%' }}>
                      {col.header}
                      {sortOrder === 'asc' ? (
                        <ArrowUp size={11} weight='bold' color={T.primary} />
                      ) : sortOrder === 'desc' ? (
                        <ArrowDown size={11} weight='bold' color={T.primary} />
                      ) : (
                        <ArrowUp size={11} weight='bold' color={T.gray20} />
                      )}
                    </span>
                  ) : col.header}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody style={{ transition: 'opacity 200ms', opacity: isLoading ? 0.4 : 1 }}>
          {subAccounts.length === 0 && !isLoading ? (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: 'center', padding: '64px 0', color: T.gray50, fontSize: 14, fontWeight: 500 }}>
                No sub-accounts found
              </td>
            </tr>
          ) : (
            subAccounts.map((acc, idx) => (
              <tr
                key={acc.id}
                style={{ transition: 'background 120ms' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = T.gray5; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                {columns.map((col, i) => (
                  <td
                    key={i}
                    style={{
                      padding: '14px 16px',
                      borderBottom: idx < subAccounts.length - 1 ? `1px solid ${T.gray15}` : 'none',
                      textAlign: col.align === 'right' ? 'right' : 'left',
                    }}
                  >
                    {col.cell(acc, idx === subAccounts.length - 1)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
