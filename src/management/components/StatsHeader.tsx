import { Info } from '@phosphor-icons/react';
import { UsagesResponse } from '../services/management.service';

interface Props {
  data: UsagesResponse | null;
}

function tbDisplay(value?: number): string {
  if (value == null) return '—';
  return `${value.toFixed(4)} TB`;
}

function numberDisplay(value?: number): string {
  if (value == null) return '—';
  return value.toLocaleString();
}

const Tooltip = ({ text }: { text: string }) => (
  <span className='group relative inline-flex items-center ml-1'>
    <Info size={14} className='text-gray-400 cursor-help' />
    <span className='absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 w-48 z-10'>
      {text}
    </span>
  </span>
);

export const StatsHeader = ({ data }: Props) => {
  const totalReserved = data?.totalReservedCapacity;
  const totalAllocated = data?.totalAllocatedStorage;
  const usedBillable = data?.usedBillableStorage;
  const remaining = data?.remainingCapacity;
  const subAccountStorage = data?.subAccountStorage;
  const controlAccountStorage = data?.controlAccountStorage;
  const totalActive = data?.totalActiveObjects;
  const totalDeleted = data?.totalDeletedObjects;

  const usagePercent =
    totalReserved && usedBillable
      ? Math.min(100, (usedBillable / totalReserved) * 100)
      : 0;

  const isOverThreshold = usagePercent >= 50;

  return (
    <div className='flex flex-col gap-3'>
      {/* Top stats bar */}
      <div className='flex gap-4 bg-white rounded border border-gray-200 p-4'>
        <div className='flex-1 border-r border-gray-200 pr-4'>
          <div className='flex flex-col gap-3'>
            <div className='flex gap-6'>
              <StatItem label='Total Reserved Capacity Storage' value={tbDisplay(totalReserved)} />
              <StatItem
                label={
                  <span className='flex items-center'>
                    Total Allocated Storage
                    <Tooltip text='Total storage allocated across all sub-accounts' />
                  </span>
                }
                value={tbDisplay(totalAllocated)}
              />
              <StatItem
                label={
                  <span className='flex items-center'>
                    Used Billable Storage
                    <Tooltip text='Storage actually used and billed' />
                  </span>
                }
                value={tbDisplay(usedBillable)}
                valueClass='text-orange-500'
              />
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
                {tbDisplay(usedBillable)} of {tbDisplay(totalReserved)} used
              </span>
            </div>
          </div>
        </div>

        {/* Right side cards */}
        <div className='flex flex-col gap-2 min-w-[220px]'>
          <div className='flex items-center gap-3 p-2 border border-gray-100 rounded'>
            <div className='text-green-500 text-xl'>⊕</div>
            <div className='flex flex-col flex-1'>
              <span className='text-xs text-gray-500'>Sub-Account Storage</span>
              <span className='text-xs text-gray-500'>Total Storage</span>
            </div>
            <div className='flex flex-col text-right'>
              <span className='text-sm font-medium'>{tbDisplay(subAccountStorage)}</span>
              <span className='text-sm font-medium'>
                {tbDisplay((subAccountStorage ?? 0) + (controlAccountStorage ?? 0))}
              </span>
            </div>
          </div>

          <div className='flex items-center gap-3 p-2 border border-gray-100 rounded'>
            <div className='text-green-500 text-xl'>⊕</div>
            <div className='flex flex-col flex-1'>
              <span className='text-xs text-gray-500'>Active Objects</span>
              <span className='text-xs text-gray-500'>Total Objects</span>
            </div>
            <div className='flex flex-col text-right'>
              <span className='text-sm font-medium'>{numberDisplay(totalActive)}</span>
              <span className='text-sm font-medium'>
                {numberDisplay((totalActive ?? 0) + (totalDeleted ?? 0))}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Warning banner */}
      {isOverThreshold && (
        <div className='flex items-center gap-2 bg-orange-50 border border-orange-200 rounded px-4 py-2 text-sm text-orange-800'>
          <span>⚠</span>
          <span>
            Your storage account is at <strong>{usagePercent.toFixed(0)}%</strong> of your RCS
            contract. Once you exceed your purchased RCS storage, additional objects stored will be
            charged overages. Contact your partner or Wasabi Sales Representative to add capacity.
          </span>
        </div>
      )}
    </div>
  );
};

const StatItem = ({
  label,
  value,
  valueClass = 'text-gray-900',
}: {
  label: React.ReactNode;
  value: string;
  valueClass?: string;
}) => (
  <div className='flex flex-col gap-0.5'>
    <span className='text-xs text-gray-500 whitespace-nowrap'>{label}</span>
    <span className={`text-sm font-semibold ${valueClass}`}>{value}</span>
  </div>
);
