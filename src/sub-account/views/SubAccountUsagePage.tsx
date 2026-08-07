import { CSSProperties, useState } from 'react';
import {
  CalendarBlankIcon,
  DownloadSimpleIcon,
  InfoIcon,
} from '@phosphor-icons/react';
import dayjs from 'dayjs';
import { useSubAccount } from '../context/SubAccountContext';
import { T, shadow, text } from '../../styles/tokens';
import { Pagination } from '../../components/Pagination';
import { useUsageData, UsageRecord, PAGE_SIZE_OPTIONS, MAX_RANGE_MONTHS } from '../hooks/useUsageData';

const TB = 1e12;

// ─── Shared styles ──────────────────────────────────────────────────────────────
// Reused across multiple elements below to avoid repeating the same style object.

const cardStyle: CSSProperties = {
  background: T.white,
  border: `1px solid ${T.gray20}`,
  borderRadius: 12,
  boxShadow: shadow.sm,
};

const sectionLabelStyle: CSSProperties = {
  fontSize: 12, fontWeight: 500, color: T.gray60,
  textTransform: 'uppercase', letterSpacing: '0.04em',
};

const tabularNumStyle: CSSProperties = {
  fontSize: 14, color: T.gray80, fontVariantNumeric: 'tabular-nums',
};

const dateInputStyle: CSSProperties = {
  height: 36, padding: '0 10px', borderRadius: 8, fontSize: 13,
  border: `1px solid ${T.gray20}`, fontFamily: 'inherit',
  color: T.gray100, outline: 'none',
};

const toolbarButtonStyle: CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6,
  height: 40, padding: '0 14px',
  border: `1px solid ${T.gray20}`, borderRadius: 8,
  background: T.white, cursor: 'pointer', fontSize: 13,
  color: T.gray80, fontFamily: 'inherit',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtTB(bytes: number): string {
  return (bytes / TB).toFixed(3);
}

function fmtObjects(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} M`;
  return n.toLocaleString('en-US');
}

function fmtDate(iso: string): string {
  return dayjs(iso).format('DD-MMM-YYYY');
}

function exportCsv(records: UsageRecord[]) {
  const header = 'Record date,Active storage (TB),Deleted storage (TB),Active objects\n';
  const rows = records
    .map(r => `${r.date},${fmtTB(r.active)},${fmtTB(r.deleted)},${r.objects}`)
    .join('\n');
  const blob = new Blob([header + rows], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'usage.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// ─── StatStrip ────────────────────────────────────────────────────────────────

interface StatItem { label: string; value: string; unit?: string; hint: string; }

const StatStrip = ({ stats }: { stats: StatItem[] }) => (
  <div style={{ ...cardStyle, display: 'flex' }}>
    {stats.map((s, i) => (
      <div key={s.label} style={{
        flex: 1, padding: '20px 24px',
        borderLeft: i > 0 ? `1px solid ${T.gray20}` : 'none',
      }}>
        <p style={{ ...sectionLabelStyle, marginBottom: 6 }}>{s.label}</p>
        <p style={{
          display: 'flex', alignItems: 'baseline', gap: 5, marginBottom: 4,
        }}>
          <span style={{ fontSize: 32, fontWeight: 600, color: T.gray100,
            lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>{s.value}</span>
          {s.unit && <span style={{ fontSize: 14, color: T.gray60 }}>{s.unit}</span>}
        </p>
        <p style={{ fontSize: 13, color: T.gray60 }}>{s.hint}</p>
      </div>
    ))}
  </div>
);

// ─── UsageRow ─────────────────────────────────────────────────────────────────

const GRID = '1.4fr 1.4fr 1.4fr 1fr';

interface UsageRowProps { record: UsageRecord; }

const UsageRow = ({ record }: UsageRowProps) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      role="row"
      style={{
        display: 'grid', gridTemplateColumns: GRID,
        padding: '0 24px', height: 52, alignItems: 'center',
        borderBottom: `1px solid ${T.gray15}`,
        background: hovered ? T.gray5 : '#fff',
        transition: 'background 100ms',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span style={{ fontSize: 14, fontWeight: 500, color: T.gray100 }}>
        {fmtDate(record.date)}
      </span>
      <span style={tabularNumStyle}>{fmtTB(record.active)}</span>
      <span style={tabularNumStyle}>{fmtTB(record.deleted)}</span>
      <span style={tabularNumStyle}>{record.objects.toLocaleString('en-US')}</span>
    </div>
  );
};

// ─── InfoTooltip ──────────────────────────────────────────────────────────────

const InfoTooltip = ({ text: tooltipText, children }: { text: string; children: React.ReactNode }) => {
  const [visible, setVisible] = useState(false);
  return (
    <span
      style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          role="tooltip"
          style={{
            position: 'absolute', top: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)',
            width: 240, zIndex: 50,
            background: T.gray100, color: T.white,
            borderRadius: 8, boxShadow: shadow.md,
            padding: '8px 10px',
            fontSize: 12, lineHeight: 1.4, textAlign: 'justify',
          }}
        >
          {tooltipText}
        </div>
      )}
    </span>
  );
};

// ─── UsageView ────────────────────────────────────────────────────────────────

export const UsageView = () => {
  const { entityId } = useSubAccount();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const {
    fromDate, toDate, handleFromChange, handleToChange,
    isLoading, sorted, paged, totals,
    pageNumber, pageSize, setPageSize, goToPrevPage, goToNextPage,
  } = useUsageData(entityId);

  const stats: StatItem[] = [
    {
      label: 'Active storage',
      value: fmtTB(totals.active),
      unit: 'TB',
      hint: 'Billable data stored',
    },
    {
      label: 'Deleted storage',
      value: fmtTB(totals.deleted),
      unit: 'TB',
      hint: 'Deleted in the last 30 days',
    },
    {
      label: 'Active objects',
      value: fmtObjects(totals.objects),
      hint: `${totals.objects.toLocaleString('en-US')} objects total`,
    },
  ];

  const dateRangeLabel = `${dayjs(fromDate).format('DD-MMM-YYYY')} – ${dayjs(toDate).format('DD-MMM-YYYY')}`;

  const HEADERS = ['Record date', 'Active storage (TB)', 'Deleted storage (TB)', 'Active objects'];

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 16,
      maxWidth: 1200, margin: '0 auto', width: '100%', padding: '8px 0 32px',
    }}>
      <StatStrip stats={stats} />

      {/* Account Usage card */}
      <div style={{ ...cardStyle, overflow: 'hidden' }}>
        {/* Card header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 24px', gap: 16,
          borderBottom: `1px solid ${T.gray15}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ ...text.heading }}>
              Account Usage
            </span>
            <InfoTooltip text="Account Usage is calculated once per day. After this daily job completes, the UI will update with the latest data for the most recent day. New Accounts and new Buckets will not see data reported until the next day.">
              <InfoIcon
                size={16}
                color={T.gray50}
                aria-label="Account Usage is calculated once per day. After this daily job completes, the UI will update with the latest data for the most recent day. New Accounts and new Buckets will not see data reported until the next day."
              />
            </InfoTooltip>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Date range picker */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowDatePicker(p => !p)}
                style={{ ...toolbarButtonStyle, gap: 8, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}
              >
                <CalendarBlankIcon size={16} color={T.gray50} />
                {dateRangeLabel}
              </button>
              {showDatePicker && (
                <div style={{
                  position: 'absolute', right: 0, top: 44, zIndex: 40,
                  background: '#fff', border: `1px solid ${T.gray20}`,
                  borderRadius: 10, boxShadow: shadow.md,
                  padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10,
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 12, fontWeight: 500, color: T.gray60 }}>From</label>
                    <input
                      type="date" value={fromDate}
                      max={toDate}
                      min={dayjs(toDate).subtract(MAX_RANGE_MONTHS, 'month').format('YYYY-MM-DD')}
                      onChange={e => handleFromChange(e.target.value)}
                      style={dateInputStyle}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 12, fontWeight: 500, color: T.gray60 }}>To</label>
                    <input
                      type="date" value={toDate}
                      min={fromDate}
                      max={dayjs(fromDate).add(MAX_RANGE_MONTHS, 'month').format('YYYY-MM-DD')}
                      onChange={e => handleToChange(e.target.value)}
                      style={dateInputStyle}
                    />
                  </div>
                  <button
                    onClick={() => setShowDatePicker(false)}
                    style={{
                      height: 34, borderRadius: 8, background: T.primary,
                      color: '#fff', border: 'none', fontSize: 13, fontWeight: 500,
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    Apply
                  </button>
                </div>
              )}
            </div>

            {/* Export button */}
            <button
              onClick={() => exportCsv(sorted)}
              title="Export as CSV"
              style={{ ...toolbarButtonStyle, fontWeight: 500 }}
            >
              <DownloadSimpleIcon size={16} />
              Export
            </button>
          </div>
        </div>

        {/* Table header */}
        <div role="row" style={{
          display: 'grid', gridTemplateColumns: GRID,
          padding: '10px 24px',
          background: T.gray5,
          borderBottom: `1px solid ${T.gray15}`,
        }}>
          {HEADERS.map((label) => (
            <span key={label} style={sectionLabelStyle}>{label}</span>
          ))}
        </div>

        {/* Rows */}
        {isLoading ? (
          <div style={{ padding: '40px 24px', textAlign: 'center', color: T.gray50, fontSize: 14 }}>
            Loading usage data…
          </div>
        ) : sorted.length === 0 ? (
          <div style={{ padding: '56px 24px', textAlign: 'center' }}>
            <p style={{ fontSize: 14, fontWeight: 500, color: T.gray80, margin: 0 }}>No usage data for this period</p>
            <p style={{ fontSize: 13, color: T.gray50, marginTop: 4 }}>Try expanding the date range.</p>
          </div>
        ) : (
          paged.map(r => <UsageRow key={r.date} record={r} />)
        )}

        <Pagination
          pageSize={pageSize}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          onPageSizeChange={(size) => setPageSize(size)}
          pageNumber={pageNumber}
          hasPrevPage={pageNumber > 1}
          hasNextPage={pageNumber * pageSize < sorted.length}
          onPrev={goToPrevPage}
          onNext={goToNextPage}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

// ─── Page wrapper ─────────────────────────────────────────────────────────────

export const SubAccountUsagePage = () => (
  <div style={{ padding: '0 28px' }}>
    <UsageView />
  </div>
);
