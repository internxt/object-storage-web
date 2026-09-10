import { useNavigate } from 'react-router-dom';
import { WholesalerPartner } from '../services/wholesalers.service';

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
  { label: 'Name', align: 'left' },
  { label: 'Email', align: 'left' },
  { label: 'Sub-accounts', align: 'right' },
  { label: 'Active Storage (TB)', align: 'right' },
  { label: 'Status', align: 'left' },
  { label: 'Created', align: 'left' },
] as const;

export const WholesalersPartnersTable = ({ partners, isLoading }: Props) => {
  const navigate = useNavigate();

  return (
    <div className='overflow-x-auto relative'>
      <div
        className={`absolute top-0 left-0 right-0 h-[2px] overflow-hidden transition-opacity duration-300 ${isLoading ? 'opacity-100' : 'opacity-0'}`}
      >
        <div className='h-full bg-indigo-400/30 w-full'>
          <div className='h-full bg-indigo-400 animate-loading-bar' />
        </div>
      </div>

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
        <tbody className={`transition-opacity duration-200 ${isLoading ? 'opacity-40' : 'opacity-100'}`}>
          {partners.length === 0 && !isLoading ? (
            <tr>
              <td colSpan={COL_HEADERS.length} className='text-center py-16 text-gray-300 text-sm font-medium'>
                No partners found
              </td>
            </tr>
          ) : (
            partners.map((p, idx) => (
              <tr
                key={p.id}
                className='group hover:bg-gray-50/80 transition-colors cursor-pointer'
                onClick={() => navigate(`/wholesalers/partners/${p.id}`, { state: { partner: p } })}
              >
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
