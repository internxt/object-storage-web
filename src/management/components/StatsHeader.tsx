import { UsagesSummary } from '../services/management.service';

interface Props {
  data: UsagesSummary | null;
}

function tbDisplay(value?: number): string {
  if (value == null) return '—';
  return value.toFixed(2);
}

export const StatsHeader = ({ data }: Props) => {
  const rcs = 1126.4;
  const used = data?.usedBillableStorageTb;
  const remaining = data?.remainingCapacityTB;
  const usagePercent = rcs && used ? Math.min(100, (used / rcs) * 100) : 0;

  const barColor =
    usagePercent >= 90 ? '#ef4444' : usagePercent >= 70 ? '#f97316' : '#6366f1';

  return (
    <div className='bg-white rounded-2xl overflow-hidden' style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' }}>
      <div className='px-10 pt-9 pb-8'>
        {/* Top label */}
        <p className='text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400 mb-7'>
          Storage Overview
        </p>

        {/* Three stats */}
        <div className='flex items-start gap-0 mb-8'>
          <StatBlock label='Total Reserved' value={tbDisplay(rcs)} muted />
          <Divider />
          <StatBlock label='Used Billable' value={tbDisplay(used)} accent='#6366f1' />
          <Divider />
          <StatBlock label='Remaining' value={tbDisplay(remaining)} accent='#10b981' />
        </div>

        {/* Progress bar */}
        <div className='flex flex-col gap-2'>
          <div className='w-full bg-gray-100 rounded-full h-1.5 overflow-hidden'>
            <div
              className='h-full rounded-full transition-all duration-700 ease-out'
              style={{ width: `${usagePercent}%`, backgroundColor: barColor }}
            />
          </div>
          <div className='flex justify-between items-center'>
            <span className='text-[11px] text-gray-400'>
              {tbDisplay(used)} TB of {tbDisplay(rcs)} TB used
            </span>
            <span className='text-[11px] font-semibold text-gray-500'>{usagePercent.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatBlock = ({
  label,
  value,
  accent,
  muted = false,
}: {
  label: string;
  value: string;
  accent?: string;
  muted?: boolean;
}) => (
  <div className='flex flex-col gap-1.5 flex-1'>
    <span className='text-[11px] font-medium text-gray-400 tracking-wide'>{label}</span>
    <div className='flex items-baseline gap-1.5'>
      <span
        className={`font-semibold tracking-tight leading-none text-3xl ${muted ? 'text-gray-800' : ''}`}
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </span>
      <span className='text-sm font-medium text-gray-400'>TB</span>
    </div>
  </div>
);

const Divider = () => (
  <div className='w-px bg-gray-100 self-stretch mx-8' />
);
