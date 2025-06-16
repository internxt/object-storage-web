import { Database, Info } from '@phosphor-icons/react';
import Tooltip from '../Tooltip';
interface InfoCardProps {
  value: string;
  name: string;
  icon?: React.ReactNode;
  subValues?: Array<{
    label: string;
    value: string;
  }>;
  isWider?: boolean;
  className?: string;
  tooltip?: string;
}

export const InfoCard = ({
  value,
  name,
  icon,
  subValues,
  isWider,
  className,
  tooltip,
}: InfoCardProps) => {
  return (
    <div
      className={`flex flex-col gap-4 bg-white shadow-sm rounded-b-sm rounded-t-xs p-4 border-t-4 border-primary min-h-[120px] ${
        isWider ? 'min-w-[500px] w-auto' : 'max-w-[300px] w-full'
      } ${className || ''}`}
    >
      <div className='flex flex-row items-center justify-between h-full'>
        <div className='flex flex-row items-center gap-4'>
          {icon && (
            <div className='flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full'>
              <div className='text-blue-600'>{icon}</div>
            </div>
          )}
          <div className='flex flex-col gap-1'>
            <p className='font-medium text-lg'>{value}</p>
            <div className='flex flex-row gap-2 items-center text-black/60'>
              <p className='text-sm'>{name}</p>
              {tooltip && (
                <Tooltip title={tooltip} popsFrom='bottom' className='text-xs'>
                  <Info size={16} />
                </Tooltip>
              )}
            </div>
          </div>
        </div>

        {subValues && (
          <div className='flex flex-col gap-2'>
            {subValues.map((subValue, index) => (
              <div key={index} className='flex flex-row items-center gap-8'>
                <span className='text-sm text-gray-600 whitespace-nowrap'>
                  {subValue.label}
                </span>
                <span className='text-sm font-medium text-black'>
                  {subValue.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const CapacityCard = ({
  totalCapacity,
  usedCapacity,
  remainingCapacity,
  className,
  tooltip,
}: {
  totalCapacity: string;
  usedCapacity: string;
  remainingCapacity: string;
  className?: string;
  tooltip?: string;
}) => {
  return (
    <InfoCard
      value={totalCapacity}
      name='Total Capacity'
      icon={<Database size={32} />}
      subValues={[
        { label: 'Used Capacity', value: usedCapacity },
        { label: 'Remaining Capacity', value: remainingCapacity },
      ]}
      isWider={true}
      className={className}
      tooltip={tooltip}
    />
  );
};
