import { UsagesSummary } from '../services/management.service';

import { SubAccount } from '../services/management.service';

interface Props {
  data: UsagesSummary | null;
  topClient: SubAccount | null;
}

function tbDisplay(value?: number | null): string {
  if (value == null) return '—';
  return value.toFixed(2);
}

export const StatsHeader = ({ data, topClient: top }: Props) => {
  const used = data?.usedBillableStorageTb;


  return (
    <div
      className='bg-white rounded-2xl overflow-hidden'
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' }}
    >
      <div className='px-10 pt-9 pb-3'>
        <p className='text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400'>
          Storage Overview
        </p>
      </div>
      <div className='px-10 pb-9 flex items-center gap-0'>
        {/* Total Used Space */}
        <div className='flex flex-col gap-2 flex-1'>
          <p className='text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400'>
            Total Used Space
          </p>
          <div className='flex items-baseline gap-2'>
            <span
              className='text-5xl font-semibold tracking-tight leading-none'
              style={{ color: '#6366f1' }}
            >
              {tbDisplay(used)}
            </span>
            <span className='text-xl font-medium text-gray-400'>TB</span>
          </div>
        </div>

        <Divider />

        {/* MoM Growth */}
        <div className='flex flex-col gap-2 flex-1'>
          <p className='text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400'>
            MoM Growth
          </p>
          <div className='flex items-baseline gap-2'>
            <span className='text-5xl font-semibold tracking-tight leading-none text-gray-300'>
              -
            </span>
            <span className='text-xl font-medium text-gray-300'>%</span>
          </div>
        </div>

        <Divider />

        {/* Top Client */}
        <div className='flex flex-col gap-2 flex-1'>
          <p className='text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400'>
            Top Client
          </p>
          {top ? (
            <>
              <div className='flex items-baseline gap-2'>
                <span className='text-5xl font-semibold tracking-tight leading-none' style={{ color: '#10b981' }}>
                  {tbDisplay(top.activeStorage)}
                </span>
                <span className='text-xl font-medium text-gray-400'>TB</span>
              </div>
              <span className='text-[11px] text-gray-400 truncate max-w-[200px]'>
                {top.email ?? top.id}
              </span>
            </>
          ) : (
            <span className='text-5xl font-semibold tracking-tight leading-none text-gray-300'>—</span>
          )}
        </div>
      </div>
    </div>
  );
};

const Divider = () => (
  <div className='w-px bg-gray-100 self-stretch mx-10' />
);
