import dayjs from 'dayjs';

const INPUT_CLASS =
  'border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-indigo-400';

interface UsageDateRangeProps {
  from: string;
  to: string;
  maxDays: number;
  onChange: (range: { from: string; to: string }) => void;
}

export const UsageDateRange = ({ from, to, maxDays, onChange }: UsageDateRangeProps) => (
  <>
    <label className='text-xs text-gray-500'>From</label>
    <input
      type='date'
      value={from}
      max={dayjs(to).subtract(1, 'day').format('YYYY-MM-DD')}
      onChange={(e) => {
        const newFrom = e.target.value;
        const exceedsMax = dayjs(to).diff(dayjs(newFrom), 'day') > maxDays;
        onChange({ from: newFrom, to: exceedsMax ? dayjs(newFrom).add(maxDays, 'day').format('YYYY-MM-DD') : to });
      }}
      className={INPUT_CLASS}
    />
    <label className='text-xs text-gray-500'>To</label>
    <input
      type='date'
      value={to}
      min={dayjs(from).add(1, 'day').format('YYYY-MM-DD')}
      max={dayjs(from).add(maxDays, 'day').format('YYYY-MM-DD')}
      onChange={(e) => onChange({ from, to: e.target.value })}
      className={INPUT_CLASS}
    />
    <span className='text-xs text-gray-400'>Max {maxDays} days</span>
  </>
);
