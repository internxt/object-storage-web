import { Database } from '@phosphor-icons/react';
import { UsagesSummary } from '../services/management.service';

interface Props {
  data: UsagesSummary | null;
}

function tbDisplay(value?: number): string {
  if (value == null) return '—';
  return `${value.toFixed(4)} TB`;
}

export const StatsHeader = ({ data }: Props) => {
  const rcs = data?.totalReservedCapacityTB;
  const used = data?.usedBillableStorageTb;
  const remaining = data?.remainingCapacityTB;
  const usagePercent = rcs && used ? Math.min(100, (used / rcs) * 100) : 0;

  const barColor =
    usagePercent >= 90 ? 'bg-red-500' : usagePercent >= 70 ? 'bg-orange-400' : 'bg-indigo-500';

  return (
    <div className='bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden'>
      <div className='flex divide-x divide-gray-100'>
        {/* Stats + progress */}
        <div className='flex-1 p-6 flex flex-col gap-6'>
          <div className='grid grid-cols-3 gap-6'>
            <StatCard
              label='Total Reserved Capacity'
              value={tbDisplay(rcs)}
              accent='text-gray-800'
            />
            <StatCard
              label='Used Billable Storage'
              value={tbDisplay(used)}
              accent='text-orange-500'
              highlight
            />
            <StatCard
              label='Remaining Capacity'
              value={tbDisplay(remaining)}
              accent='text-emerald-600'
            />
          </div>

          <div className='flex flex-col gap-2'>
            <div className='flex justify-between items-center'>
              <span className='text-xs font-medium text-gray-500'>Storage utilization</span>
              <span className='text-xs font-semibold text-gray-700'>{usagePercent.toFixed(1)}%</span>
            </div>
            <div className='w-full bg-gray-100 rounded-full h-2'>
              <div
                className={`${barColor} h-2 rounded-full transition-all duration-500`}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
            <span className='text-xs text-gray-400'>
              {tbDisplay(used)} of {tbDisplay(rcs)} used
            </span>
          </div>
        </div>

        {/* Right: total storage */}
        <div className='flex flex-col items-center justify-center px-10 gap-3 bg-gray-50/60 min-w-[220px]'>
          <div className='w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center'>
            <Database size={22} weight='duotone' className='text-indigo-600' />
          </div>
          <div className='text-center'>
            <div className='text-xl font-bold text-gray-900'>{tbDisplay(used)}</div>
            <div className='text-xs text-gray-400 mt-0.5'>Total Storage Used</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({
  label,
  value,
  accent = 'text-gray-800',
  highlight = false,
}: {
  label: string;
  value: string;
  accent?: string;
  highlight?: boolean;
}) => (
  <div className={`flex flex-col gap-1 ${highlight ? 'p-3 bg-orange-50 rounded-lg border border-orange-100' : ''}`}>
    <span className='text-xs text-gray-400 leading-tight'>{label}</span>
    <span className={`text-lg font-bold tracking-tight ${accent}`}>{value}</span>
  </div>
);
