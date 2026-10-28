import type { CSSProperties } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { T, card } from '../../sub-account/tokens';

const UPLOADED = '#0066FF';
const DOWNLOADED = '#10b981';
const GRID = '#ECECEC';
const AXIS = '#636367';

const titleStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: T.gray60,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  margin: '0 0 12px',
};

export interface ActivityPoint {
  date: string;
  uploaded: number;
  downloaded: number;
}

export const DailyActivityChart = ({ data }: { data: ActivityPoint[] }) => (
  <div style={{ ...card, padding: 16 }}>
    <p style={titleStyle}>Daily activity (GB)</p>
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: AXIS }} tickLine={false} axisLine={false} />
        <YAxis
          tick={{ fontSize: 11, fill: AXIS }}
          tickLine={false}
          axisLine={false}
          width={60}
          tickFormatter={(v) => `${v} GB`}
        />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${T.gray20}`, color: T.gray100 }}
          formatter={(v: number) => [`${v.toFixed(2)} GB`]}
          cursor={{ fill: '#F4F4F7' }}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: T.gray80 }} />
        <Bar dataKey="uploaded" name="Uploaded" fill={UPLOADED} radius={[3, 3, 0, 0]} />
        <Bar dataKey="downloaded" name="Downloaded" fill={DOWNLOADED} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </div>
);
