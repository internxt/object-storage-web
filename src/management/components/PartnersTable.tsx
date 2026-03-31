import { useNavigate } from 'react-router-dom';
import { Partner } from '../services/partners.service';
import { ArrowUp, ArrowDown } from '@phosphor-icons/react';

export type SortOrder = 'asc' | 'desc';

interface Props {
  partners: Partner[];
  isLoading: boolean;
  sortOrder?: SortOrder;
  onSortActiveStorage?: (order: SortOrder) => void;
}

const StatusBadge = ({ status }: { status: Partner['status'] }) => {
  const config = {
    ACTIVE:  { bg: '#f0fdf4', border: '#bbf7d0', color: '#15803d', dot: '#22c55e', label: 'Active' },
    DELETED: { bg: '#fef2f2', border: '#fecaca', color: '#b91c1c', dot: '#f87171', label: 'Deleted' },
  }[status];

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

const formatDate = (date?: string | null) =>
  date ? new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const formatStorage = (value?: number) => {
  if (value == null) return '—';
  if (value === 0) return <span className='text-gray-300'>0.0000</span>;
  return value.toFixed(4);
};

const COL_HEADERS = [
  { label: 'ID',                  align: 'left'  },
  { label: 'Name',                align: 'left'  },
  { label: 'Email',               align: 'left'  },
  { label: 'Sub-accounts',        align: 'right' },
  { label: 'Active Storage (TB)', align: 'right' },
  { label: 'Status',              align: 'left'  },
  { label: 'Provider Created',    align: 'left'  },
  { label: 'Created',             align: 'left'  },
] as const;

export const PartnersTable = ({ partners, isLoading, sortOrder, onSortActiveStorage }: Props) => {
  const navigate = useNavigate();

  return (
    <div className='overflow-x-auto relative'>
      {/* Loading bar */}
      <div className={`absolute top-0 left-0 right-0 h-[2px] overflow-hidden transition-opacity duration-300 ${isLoading ? 'opacity-100' : 'opacity-0'}`}>
        <div className='h-full bg-indigo-400/30 w-full'>
          <div className='h-full bg-indigo-400 animate-loading-bar' />
        </div>
      </div>

      <table className='w-full text-sm text-left border-separate border-spacing-0'>
        <thead>
          <tr>
            {COL_HEADERS.map((h, i) => {
              const isActiveStorage = h.label === 'Active Storage (TB)';
              return (
                <th
                  key={i}
                  onClick={isActiveStorage ? () => onSortActiveStorage?.(sortOrder === 'asc' ? 'desc' : 'asc') : undefined}
                  className={`px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-400 border-b border-gray-100 bg-white whitespace-nowrap ${h.align === 'right' ? 'text-right' : ''} ${isActiveStorage ? 'cursor-pointer hover:text-gray-600 select-none' : ''}`}
                >
                  {isActiveStorage ? (
                    <span className='inline-flex items-center gap-1 justify-end w-full'>
                      {h.label}
                      {sortOrder === 'asc' ? (
                        <ArrowUp size={11} weight='bold' className='text-indigo-400' />
                      ) : sortOrder === 'desc' ? (
                        <ArrowDown size={11} weight='bold' className='text-indigo-400' />
                      ) : (
                        <ArrowUp size={11} weight='bold' className='text-gray-200' />
                      )}
                    </span>
                  ) : h.label}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className={`transition-opacity duration-200 ${isLoading ? 'opacity-40' : 'opacity-100'}`}>
          {partners.length === 0 && !isLoading ? (
            <tr>
              <td colSpan={COL_HEADERS.length} className='text-center py-16 text-gray-300 text-sm font-medium'>
                No partners found
              </td>
            </tr>
          ) : (
            partners.map((p, idx) => (
              <tr key={p.id} className='group hover:bg-gray-50/80 transition-colors cursor-default'>
                <td
                  className={`px-4 py-3.5 ${idx < partners.length - 1 ? 'border-b border-gray-50' : ''}`}
                  onClick={() => navigate(`/management/partners/${p.id}`, { state: { partner: p } })}
                >
                  <span className='font-mono text-[11px] text-[#1e3a5f] hover:text-[#122840] underline underline-offset-2 cursor-pointer tracking-tight'>
                    {p.storageProviderId.slice(0, 8)}…{p.storageProviderId.slice(-4)}
                  </span>
                </td>
                <td className={`px-4 py-3.5 text-[13px] text-gray-700 ${idx < partners.length - 1 ? 'border-b border-gray-50' : ''}`}>
                  {p.name ?? <span className='text-gray-300'>—</span>}
                </td>
                <td className={`px-4 py-3.5 text-[13px] text-gray-500 ${idx < partners.length - 1 ? 'border-b border-gray-50' : ''}`}>
                  {p.email ?? <span className='text-gray-300'>—</span>}
                </td>
                <td className={`px-4 py-3.5 text-right font-mono text-[12px] text-gray-500 tabular-nums ${idx < partners.length - 1 ? 'border-b border-gray-50' : ''}`}>
                  {p.subAccountsCount}
                </td>
                <td className={`px-4 py-3.5 text-right font-mono text-[12px] text-gray-700 tabular-nums ${idx < partners.length - 1 ? 'border-b border-gray-50' : ''}`}>
                  {formatStorage(p.activeStorageTb)}
                </td>
                <td className={`px-4 py-3.5 ${idx < partners.length - 1 ? 'border-b border-gray-50' : ''}`}>
                  <StatusBadge status={p.status} />
                </td>
                <td className={`px-4 py-3.5 text-[12px] text-gray-500 whitespace-nowrap ${idx < partners.length - 1 ? 'border-b border-gray-50' : ''}`}>
                  {formatDate(p.providerCreatedAt)}
                </td>
                <td className={`px-4 py-3.5 text-[12px] text-gray-500 whitespace-nowrap ${idx < partners.length - 1 ? 'border-b border-gray-50' : ''}`}>
                  {formatDate(p.createdAt)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
