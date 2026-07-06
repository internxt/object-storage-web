import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CalendarBlankIcon,
  CaretDownIcon,
  CaretUpIcon,
  DownloadSimpleIcon,
  InfoIcon,
} from '@phosphor-icons/react';
import dayjs from 'dayjs';
import subAccountAxios from '../core/sub-account-axios';
import { useSubAccount } from '../context/SubAccountContext';
import { T, shadow, text } from '../tokens';
import { Pagination } from '../../components/Pagination';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UsageRecord {
  date: string;        // YYYY-MM-DD
  active: number;      // bytes
  deleted: number;     // bytes
  objects: number;
}

interface WacmUsageItem {
  startTime: string;
  endTime: string;
  activeStorage: number;
  deletedStorage: number;
  activeObjects: number;
}

const TB = 1e12;

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
  <div style={{
    background: '#fff',
    border: `1px solid ${T.gray20}`,
    borderRadius: 12,
    boxShadow: shadow.sm,
    display: 'flex',
  }}>
    {stats.map((s, i) => (
      <div key={s.label} style={{
        flex: 1, padding: '20px 24px',
        borderLeft: i > 0 ? `1px solid ${T.gray20}` : 'none',
      }}>
        <p style={{
          fontSize: 12, fontWeight: 500, color: T.gray60,
          letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 6,
        }}>{s.label}</p>
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
      <span style={{
        fontSize: 14, fontWeight: 500,
        color: T.primary,
        textDecoration: hovered ? 'underline' : 'none',
        cursor: 'default',
      }}>
        {fmtDate(record.date)}
      </span>
      <span style={{ fontSize: 14, color: T.gray80, fontVariantNumeric: 'tabular-nums' }}>
        {fmtTB(record.active)}
      </span>
      <span style={{ fontSize: 14, color: T.gray80, fontVariantNumeric: 'tabular-nums' }}>
        {fmtTB(record.deleted)}
      </span>
      <span style={{ fontSize: 14, color: T.gray80, fontVariantNumeric: 'tabular-nums' }}>
        {record.objects.toLocaleString('en-US')}
      </span>
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

type SortDir = 'asc' | 'desc';

const PAGE_SIZE_OPTIONS = [25, 50, 100];

export const UsageView = () => {
  const { entityId } = useSubAccount();
  const [fromDate, setFromDate] = useState(dayjs().subtract(30, 'days').format('YYYY-MM-DD'));
  const [toDate, setToDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [records, setRecords] = useState<UsageRecord[]>([]);
  const [statsRecord, setStatsRecord] = useState<UsageRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const fromRef = useRef<HTMLInputElement>(null);
  const toRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPageNumber(1);
  }, [fromDate, toDate, entityId]);

  useEffect(() => {
    if (entityId) fetchUsage(fromDate, toDate, pageNumber, pageSize);
  }, [fromDate, toDate, entityId, pageNumber, pageSize]);

  const fetchUsage = async (from: string, to: string, page: number, perPage: number) => {
    setIsLoading(true);
    try {
      const { data } = await subAccountAxios.get<WacmUsageItem[]>(
        `/sub-accounts/${entityId}/usages`,
        { params: { from, to, page: page - 1, perPage } },
      );
      const mapped = data.map(u => ({
        date: u.startTime.slice(0, 10),
        active: u.activeStorage,
        deleted: u.deletedStorage,
        objects: u.activeObjects,
      }));
      setRecords(mapped);
      if (page === 1) {
        const latest = [...mapped].sort((a, b) => b.date.localeCompare(a.date))[0] ?? null;
        setStatsRecord(latest);
      }
    } catch {
      setRecords([]);
      if (page === 1) setStatsRecord(null);
    } finally {
      setIsLoading(false);
    }
  };

  const sorted = useMemo(() => {
    return [...records].sort((a, b) =>
      sortDir === 'desc'
        ? b.date.localeCompare(a.date)
        : a.date.localeCompare(b.date),
    );
  }, [records, sortDir]);

  const totals = {
    active: statsRecord?.active ?? 0,
    deleted: statsRecord?.deleted ?? 0,
    objects: statsRecord?.objects ?? 0,
  };

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

  const HEADERS = [
    { label: 'Record date', sortable: true },
    { label: 'Active storage (TB)', sortable: false },
    { label: 'Deleted storage (TB)', sortable: false },
    { label: 'Active objects', sortable: false },
  ];

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 16,
      maxWidth: 1200, margin: '0 auto', width: '100%', padding: '8px 0 32px',
    }}>
      <StatStrip stats={stats} />

      {/* Account Usage card */}
      <div style={{
        background: '#fff',
        border: `1px solid ${T.gray20}`,
        borderRadius: 12,
        boxShadow: shadow.sm,
        overflow: 'hidden',
      }}>
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
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  height: 40, padding: '0 14px',
                  border: `1px solid ${T.gray20}`, borderRadius: 8,
                  background: '#fff', cursor: 'pointer', fontSize: 13,
                  color: T.gray80, fontFamily: 'inherit',
                  fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
                }}
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
                      ref={fromRef} type="date" value={fromDate}
                      onChange={e => { setFromDate(e.target.value); }}
                      style={{
                        height: 36, padding: '0 10px', borderRadius: 8, fontSize: 13,
                        border: `1px solid ${T.gray20}`, fontFamily: 'inherit',
                        color: T.gray100, outline: 'none',
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 12, fontWeight: 500, color: T.gray60 }}>To</label>
                    <input
                      ref={toRef} type="date" value={toDate}
                      onChange={e => { setToDate(e.target.value); }}
                      style={{
                        height: 36, padding: '0 10px', borderRadius: 8, fontSize: 13,
                        border: `1px solid ${T.gray20}`, fontFamily: 'inherit',
                        color: T.gray100, outline: 'none',
                      }}
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
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                height: 40, padding: '0 14px',
                border: `1px solid ${T.gray20}`, borderRadius: 8,
                background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                color: T.gray80, fontFamily: 'inherit',
              }}
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
          {HEADERS.map((h) => (
            <button
              key={h.label}
              onClick={h.sortable ? () => setSortDir(d => d === 'desc' ? 'asc' : 'desc') : undefined}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                fontSize: 12, fontWeight: 500, color: T.gray60,
                textTransform: 'uppercase', letterSpacing: '0.04em',
                background: 'none', border: 'none', padding: 0, fontFamily: 'inherit',
                cursor: h.sortable ? 'pointer' : 'default', textAlign: 'left',
              }}
            >
              {h.label}
              {h.sortable && (
                sortDir === 'desc'
                  ? <CaretDownIcon size={13} weight="bold" />
                  : <CaretUpIcon size={13} weight="bold" />
              )}
            </button>
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
          sorted.map(r => <UsageRow key={r.date} record={r} />)
        )}

        <Pagination
          pageSize={pageSize}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          onPageSizeChange={(size) => { setPageSize(size); setPageNumber(1); }}
          pageNumber={pageNumber}
          hasPrevPage={pageNumber > 1}
          hasNextPage={records.length === pageSize}
          onPrev={() => setPageNumber(p => Math.max(1, p - 1))}
          onNext={() => setPageNumber(p => p + 1)}
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
