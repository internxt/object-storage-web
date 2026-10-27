import type { CSSProperties } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { T, card } from '../../sub-account/tokens';

// SVG presentation attributes don't resolve CSS variables, so the chart uses the tokens' fallback colours.
const ACTIVE = '#0066FF';
const DELETED = '#8E8E94';
const GRID = '#ECECEC';
const AXIS = '#636367';

const titleStyle: CSSProperties = {
  fontSize: 12, fontWeight: 500, color: T.gray60,
  textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 12px',
};

export interface StoragePoint {
  date: string;
  active: number;
  deleted: number;
}

export const StorageOverTimeChart = ({ data }: { data: StoragePoint[] }) => (
  <div style={{ ...card, padding: 16 }}>
    <p style={titleStyle}>Storage over time (TB)</p>
    <ResponsiveContainer width='100%' height={200}>
      <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id='colorActive' x1='0' y1='0' x2='0' y2='1'>
            <stop offset='5%' stopColor={ACTIVE} stopOpacity={0.2} />
            <stop offset='95%' stopColor={ACTIVE} stopOpacity={0} />
          </linearGradient>
          <linearGradient id='colorDeleted' x1='0' y1='0' x2='0' y2='1'>
            <stop offset='5%' stopColor={DELETED} stopOpacity={0.2} />
            <stop offset='95%' stopColor={DELETED} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray='3 3' stroke={GRID} vertical={false} />
        <XAxis dataKey='date' tick={{ fontSize: 11, fill: AXIS }} tickLine={false} axisLine={false} />
        <YAxis
          tick={{ fontSize: 11, fill: AXIS }}
          tickLine={false}
          axisLine={false}
          width={60}
          tickFormatter={(v) => `${v} TB`}
        />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${T.gray20}`, color: T.gray100 }}
          formatter={(v: number) => [`${v.toFixed(2)} TB`]}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: T.gray80 }} />
        <Area
          type='monotone'
          dataKey='active'
          name='Active Storage'
          stroke={ACTIVE}
          strokeWidth={2}
          fill='url(#colorActive)'
          dot={false}
        />
        <Area
          type='monotone'
          dataKey='deleted'
          name='Deleted Storage'
          stroke={DELETED}
          strokeWidth={2}
          fill='url(#colorDeleted)'
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);
