import { Wholesaler } from '../services/wholesalers.service';
import { ArrowSquareOut } from '@phosphor-icons/react';

interface Props {
  wholesalers: Wholesaler[];
  isLoading: boolean;
}

const formatDate = (date?: string | null) =>
  date ? new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const COL_HEADERS = [
  { label: 'Name', align: 'left' },
  { label: 'Email', align: 'left' },
  { label: 'Partners', align: 'right' },
  { label: 'Created', align: 'left' },
  { label: 'Stripe', align: 'left' },
] as const;

export const WholesalersTable = ({ wholesalers, isLoading }: Props) => {
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
          {wholesalers.length === 0 && !isLoading ? (
            <tr>
              <td colSpan={COL_HEADERS.length} className='text-center py-16 text-gray-300 text-sm font-medium'>
                No wholesalers found
              </td>
            </tr>
          ) : (
            wholesalers.map((w, idx) => (
              <tr key={w.id} className='hover:bg-gray-50/80 transition-colors'>
                <td className={`px-4 py-3.5 text-[13px] text-gray-700 ${idx < wholesalers.length - 1 ? 'border-b border-gray-50' : ''}`}>
                  {w.name}
                </td>
                <td className={`px-4 py-3.5 text-[13px] text-gray-500 ${idx < wholesalers.length - 1 ? 'border-b border-gray-50' : ''}`}>
                  {w.email}
                </td>
                <td className={`px-4 py-3.5 text-right font-mono text-[12px] text-gray-500 tabular-nums ${idx < wholesalers.length - 1 ? 'border-b border-gray-50' : ''}`}>
                  {w.partnersCount}
                </td>
                <td className={`px-4 py-3.5 text-[12px] text-gray-500 whitespace-nowrap ${idx < wholesalers.length - 1 ? 'border-b border-gray-50' : ''}`}>
                  {formatDate(w.createdAt)}
                </td>
                <td className={`px-4 py-3.5 text-[12px] whitespace-nowrap ${idx < wholesalers.length - 1 ? 'border-b border-gray-50' : ''}`}>
                  {w.customerId ? (
                    <a
                      href={`https://dashboard.stripe.com/customers/${w.customerId}`}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='inline-flex items-center gap-1 text-[#1e3a5f] hover:text-[#122840] underline underline-offset-2'
                    >
                      View <ArrowSquareOut size={12} />
                    </a>
                  ) : (
                    <span className='text-gray-300'>—</span>
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
