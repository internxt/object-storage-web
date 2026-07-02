import { useState } from 'react';
import { UsagesSummary, SubAccount } from '../services/management.service';
import { T, card } from '../../sub-account/tokens';

interface Props {
  data: UsagesSummary | null;
  topClient: SubAccount | null;
}

const ACCENT = '#6366f1';
const POSITIVE = '#10b981';
const NEGATIVE = '#ef4444';

const labelStyle = {
  fontSize: 10, fontWeight: 600, textTransform: 'uppercase' as const,
  letterSpacing: '0.14em', color: T.gray60,
};

const metricStyle = {
  fontSize: 48, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1,
};

const unitStyle = { fontSize: 20, fontWeight: 500, color: T.gray50 };

function tbDisplay(value?: number | null): string {
  if (value == null) return '—';
  return value.toFixed(2);
}

function momPeriodLabel(): string {
  const now = new Date();
  const fmt = (d: Date) => d.toLocaleDateString('en-GB', { month: 'long' });
  const current = new Date(now.getFullYear(), now.getMonth(), 1);
  const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return `(${fmt(previous)} vs ${fmt(current)})`;
}

export const StatsHeader = ({ data, topClient: top }: Props) => {
  const used = data?.usedBillableStorageTb;
  const [showPeriod, setShowPeriod] = useState(false);

  return (
    <div style={{ ...card, borderRadius: 16, display: 'flex' }}>
      {/* Total Used Space */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, padding: '28px 40px' }}>
        <p style={labelStyle}>Total Used Space</p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ ...metricStyle, color: ACCENT }}>{tbDisplay(used)}</span>
          <span style={unitStyle}>TB</span>
        </div>
      </div>

      {/* MoM Growth */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, padding: '28px 40px', borderLeft: `1px solid ${T.gray20}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <p style={labelStyle}>MoM Growth</p>
          <span
            style={{ fontSize: 11, lineHeight: 1, color: T.gray20, cursor: 'default', userSelect: 'none' }}
            onMouseEnter={() => setShowPeriod(true)}
            onMouseLeave={() => setShowPeriod(false)}
          >ⓘ</span>
          <span style={{ fontSize: 11, fontStyle: 'italic', color: T.gray50, visibility: showPeriod ? 'visible' : 'hidden' }}>
            {momPeriodLabel()}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          {data?.momGrowthPercent == null ? (
            <span style={{ ...metricStyle, color: T.gray20 }}>—</span>
          ) : (
            <>
              <span style={{ ...metricStyle, color: data.momGrowthPercent >= 0 ? POSITIVE : NEGATIVE }}>
                {data.momGrowthPercent > 0 ? '+' : ''}{data.momGrowthPercent.toFixed(2)}
              </span>
              <span style={unitStyle}>%</span>
            </>
          )}
        </div>
      </div>

      {/* Top Client */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, padding: '28px 40px', borderLeft: `1px solid ${T.gray20}` }}>
        <p style={labelStyle}>Top Client</p>
        {top ? (
          <>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ ...metricStyle, color: POSITIVE }}>{tbDisplay(top.activeStorage)}</span>
              <span style={unitStyle}>TB</span>
            </div>
            <span style={{ fontSize: 11, color: T.gray50, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>
              {top.email ?? top.id}
            </span>
          </>
        ) : (
          <span style={{ ...metricStyle, color: T.gray20 }}>—</span>
        )}
      </div>
    </div>
  );
};
