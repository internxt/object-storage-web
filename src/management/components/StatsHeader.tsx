import { useState } from 'react';
import { UsagesSummary, SubAccount } from '../services/management.service';

interface Props {
  data: UsagesSummary | null;
  topClient: SubAccount | null;
}

function tbDisplay(value?: number | null): string {
  if (value == null) return '—';
  return value.toFixed(2);
}

function momPeriodLabel(): string {
  const now = new Date();
  const fmt = (d: Date) => d.toLocaleDateString('en-GB', { month: 'long' });
  const current = new Date(now.getFullYear(), now.getMonth(), 1);
  const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return `(${fmt(previous)} vs ${fmt(current)})`;
}

export const StatsHeader = ({ data, topClient: top }: Props) => {
  const used = data?.usedBillableStorageTb;
  const [showPeriod, setShowPeriod] = useState(false);


  return (
    <div
      className='bg-white rounded-2xl'
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
          <div className='flex items-center gap-1'>
            <p className='text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400'>
              MoM Growth
            </p>
            <span
              className='text-[11px] leading-none text-gray-300 cursor-default select-none'
              onMouseEnter={() => setShowPeriod(true)}
              onMouseLeave={() => setShowPeriod(false)}
            >ⓘ</span>
            <span className={`text-[11px] italic text-gray-400 ${showPeriod ? 'visible' : 'invisible'}`}>
              {momPeriodLabel()}
            </span>
          </div>
          <div className='flex items-baseline gap-2'>
            {data?.momGrowthPercent == null ? (
              <span className='text-5xl font-semibold tracking-tight leading-none text-gray-300'>—</span>
            ) : (
              <>
                <span
                  className='text-5xl font-semibold tracking-tight leading-none'
                  style={{ color: data.momGrowthPercent >= 0 ? '#10b981' : '#ef4444' }}
                >
                  {data.momGrowthPercent > 0 ? '+' : ''}{data.momGrowthPercent.toFixed(2)}
                </span>
                <span className='text-xl font-medium text-gray-400'>%</span>
              </>
            )}
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
