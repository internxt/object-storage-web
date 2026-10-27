import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export interface StoragePoint {
  date: string;
  active: number;
  deleted: number;
}

export const StorageOverTimeChart = ({ data }: { data: StoragePoint[] }) => (
  <div className='border border-gray-100 rounded-xl p-4 bg-white'>
    <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3'>Storage over time (TB)</p>
    <ResponsiveContainer width='100%' height={200}>
      <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id='colorActive' x1='0' y1='0' x2='0' y2='1'>
            <stop offset='5%' stopColor='#6366f1' stopOpacity={0.3} />
            <stop offset='95%' stopColor='#6366f1' stopOpacity={0} />
          </linearGradient>
          <linearGradient id='colorDeleted' x1='0' y1='0' x2='0' y2='1'>
            <stop offset='5%' stopColor='#f97316' stopOpacity={0.3} />
            <stop offset='95%' stopColor='#f97316' stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray='3 3' stroke='#e5e7eb' />
        <XAxis dataKey='date' tick={{ fontSize: 10, fill: '#111827' }} tickLine={false} axisLine={false} />
        <YAxis
          tick={{ fontSize: 10, fill: '#111827' }}
          tickLine={false}
          axisLine={false}
          width={60}
          tickFormatter={(v) => `${v} TB`}
        />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
          formatter={(v: number) => [`${v.toFixed(2)} TB`]}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Area
          type='monotone'
          dataKey='active'
          name='Active Storage'
          stroke='#6366f1'
          strokeWidth={2}
          fill='url(#colorActive)'
          dot={false}
        />
        <Area
          type='monotone'
          dataKey='deleted'
          name='Deleted Storage'
          stroke='#f97316'
          strokeWidth={2}
          fill='url(#colorDeleted)'
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);
