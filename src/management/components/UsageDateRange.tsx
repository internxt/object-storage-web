import type { CSSProperties } from 'react';
import dayjs from 'dayjs';
import { T, text } from '../../sub-account/tokens';

const labelStyle: CSSProperties = { fontSize: 12, fontWeight: 500, color: T.gray60 };

const inputStyle: CSSProperties = {
  height: 36,
  padding: '0 10px',
  borderRadius: 8,
  fontSize: 13,
  border: `1px solid ${T.gray20}`,
  fontFamily: 'inherit',
  color: T.gray100,
  background: T.white,
  outline: 'none',
};

interface UsageDateRangeProps {
  from: string;
  to: string;
  maxDays: number;
  onChange: (range: { from: string; to: string }) => void;
}

export const UsageDateRange = ({ from, to, maxDays, onChange }: UsageDateRangeProps) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
    <label style={labelStyle}>
      From{' '}
      <input
        type="date"
        value={from}
        max={dayjs(to).subtract(1, 'day').format('YYYY-MM-DD')}
        onChange={(e) => {
          const newFrom = e.target.value;
          const exceedsMax = dayjs(to).diff(dayjs(newFrom), 'day') > maxDays;
          onChange({ from: newFrom, to: exceedsMax ? dayjs(newFrom).add(maxDays, 'day').format('YYYY-MM-DD') : to });
        }}
        style={inputStyle}
      />
    </label>
    <label style={labelStyle}>
      To{' '}
      <input
        type="date"
        value={to}
        min={dayjs(from).add(1, 'day').format('YYYY-MM-DD')}
        max={dayjs(from).add(maxDays, 'day').format('YYYY-MM-DD')}
        onChange={(e) => onChange({ from, to: e.target.value })}
        style={inputStyle}
      />
    </label>
    <span style={text.caption}>Max {maxDays} days</span>
  </div>
);
