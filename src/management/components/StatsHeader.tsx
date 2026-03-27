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

  return (
    <div className='bg-white rounded border border-gray-200 p-4 flex flex-col gap-3'>
      <div className='flex gap-8'>
        <StatItem label='Total Reserved Capacity Storage' value={tbDisplay(rcs)} />
        <StatItem label='Used Billable Storage' value={tbDisplay(used)} valueClass='text-orange-500' />
        <StatItem label='Remaining Capacity' value={tbDisplay(remaining)} />
      </div>

      <div className='flex flex-col gap-1'>
        <span className='text-xs text-gray-500'>{usagePercent.toFixed(0)}%</span>
        <div className='w-full bg-gray-200 rounded-full h-3'>
          <div
            className='bg-orange-500 h-3 rounded-full transition-all'
            style={{ width: `${usagePercent}%` }}
          />
        </div>
        <span className='text-xs text-gray-500'>
          {tbDisplay(used)} of {tbDisplay(rcs)} used
        </span>
      </div>
    </div>
  );
};

const StatItem = ({
  label,
  value,
  valueClass = 'text-gray-900',
}: {
  label: string;
  value: string;
  valueClass?: string;
}) => (
  <div className='flex flex-col gap-0.5'>
    <span className='text-xs text-gray-500 whitespace-nowrap'>{label}</span>
    <span className={`text-sm font-semibold ${valueClass}`}>{value}</span>
  </div>
);
