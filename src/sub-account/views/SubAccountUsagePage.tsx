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
    border: '1px solid var(--gray-20,#E5E5EB)',
    borderRadius: 12,
    boxShadow: '0 1px 2px 0 rgba(0,0,0,.05)',
    display: 'flex',
  }}>
    {stats.map((s, i) => (
      <div key={s.label} style={{
        flex: 1, padding: '20px 24px',
        borderLeft: i > 0 ? '1px solid var(--gray-20,#E5E5EB)' : 'none',
      }}>
        <p style={{
          fontSize: 12, fontWeight: 500, color: 'var(--gray-60,#636367)',
          letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 6,
        }}>{s.label}</p>
        <p style={{
          display: 'flex', alignItems: 'baseline', gap: 5, marginBottom: 4,
        }}>
          <span style={{ fontSize: 32, fontWeight: 600, color: 'var(--gray-100,#18181B)',
            lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>{s.value}</span>
          {s.unit && <span style={{ fontSize: 14, color: 'var(--gray-60,#636367)' }}>{s.unit}</span>}
        </p>
        <p style={{ fontSize: 13, color: 'var(--gray-60,#636367)' }}>{s.hint}</p>
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
        borderBottom: '1px solid var(--gray-15,#ECECEC)',
        background: hovered ? 'var(--gray-5,#F9F9FC)' : '#fff',
        transition: 'background 100ms',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span style={{
        fontSize: 14, fontWeight: 500,
        color: 'var(--primary,#0066FF)',
        textDecoration: hovered ? 'underline' : 'none',
        cursor: 'default',
      }}>
        {fmtDate(record.date)}
      </span>
      <span style={{ fontSize: 14, color: 'var(--gray-80,#3A3A3B)', fontVariantNumeric: 'tabular-nums' }}>
        {fmtTB(record.active)}
      </span>
      <span style={{ fontSize: 14, color: 'var(--gray-80,#3A3A3B)', fontVariantNumeric: 'tabular-nums' }}>
        {fmtTB(record.deleted)}
      </span>
      <span style={{ fontSize: 14, color: 'var(--gray-80,#3A3A3B)', fontVariantNumeric: 'tabular-nums' }}>
        {record.objects.toLocaleString('en-US')}
      </span>
    </div>
  );
};

// ─── UsageView ────────────────────────────────────────────────────────────────

type SortDir = 'asc' | 'desc';

export const UsageView = () => {
  const { entityId } = useSubAccount();
  const [fromDate, setFromDate] = useState(dayjs().subtract(30, 'days').format('YYYY-MM-DD'));
  const [toDate, setToDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [records, setRecords] = useState<UsageRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const fromRef = useRef<HTMLInputElement>(null);
  const toRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (entityId) fetchUsage(fromDate, toDate);
  }, [fromDate, toDate, entityId]);

  const fetchUsage = async (from: string, to: string) => {
    setIsLoading(true);
    try {
      const { data } = await subAccountAxios.get<WacmUsageItem[]>(
        `/sub-accounts/${entityId}/usages`,
        { params: { from, to, page: 1, perPage: 100 } },
      );
      setRecords(data.map(u => ({
        date: u.startTime.slice(0, 10),
        active: u.activeStorage,
        deleted: u.deletedStorage,
        objects: u.activeObjects,
      })));
    } catch {
      setRecords([]);
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

  const totals = useMemo(() => {
    if (sorted.length === 0) return { active: 0, deleted: 0, objects: 0 };
    // show latest day's snapshot values (not cumulative)
    const latest = sorted[0];
    return { active: latest.active, deleted: latest.deleted, objects: latest.objects };
  }, [sorted]);

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
      hint: 'Pending hard-deletion',
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
        border: '1px solid var(--gray-20,#E5E5EB)',
        borderRadius: 12,
        boxShadow: '0 1px 2px 0 rgba(0,0,0,.05)',
        overflow: 'hidden',
      }}>
        {/* Card header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 24px', gap: 16,
          borderBottom: '1px solid var(--gray-15,#ECECEC)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--gray-100,#18181B)' }}>
              Account Usage
            </span>
            <InfoIcon size={16} color="var(--gray-50,#8E8E94)" aria-label="Usage information" title="Daily usage snapshots for your sub-account" />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Date range picker */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowDatePicker(p => !p)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  height: 40, padding: '0 14px',
                  border: '1px solid var(--gray-20,#E5E5EB)', borderRadius: 8,
                  background: '#fff', cursor: 'pointer', fontSize: 13,
                  color: 'var(--gray-80,#3A3A3B)', fontFamily: 'inherit',
                  fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
                }}
              >
                <CalendarBlankIcon size={16} color="var(--gray-50,#8E8E94)" />
                {dateRangeLabel}
              </button>
              {showDatePicker && (
                <div style={{
                  position: 'absolute', right: 0, top: 44, zIndex: 40,
                  background: '#fff', border: '1px solid var(--gray-20,#E5E5EB)',
                  borderRadius: 10, boxShadow: '0 4px 6px -1px rgba(0,0,0,.08)',
                  padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10,
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--gray-60,#636367)' }}>From</label>
                    <input
                      ref={fromRef} type="date" value={fromDate}
                      onChange={e => { setFromDate(e.target.value); }}
                      style={{
                        height: 36, padding: '0 10px', borderRadius: 8, fontSize: 13,
                        border: '1px solid var(--gray-20,#E5E5EB)', fontFamily: 'inherit',
                        color: 'var(--gray-100,#18181B)', outline: 'none',
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--gray-60,#636367)' }}>To</label>
                    <input
                      ref={toRef} type="date" value={toDate}
                      onChange={e => { setToDate(e.target.value); }}
                      style={{
                        height: 36, padding: '0 10px', borderRadius: 8, fontSize: 13,
                        border: '1px solid var(--gray-20,#E5E5EB)', fontFamily: 'inherit',
                        color: 'var(--gray-100,#18181B)', outline: 'none',
                      }}
                    />
                  </div>
                  <button
                    onClick={() => setShowDatePicker(false)}
                    style={{
                      height: 34, borderRadius: 8, background: 'var(--primary,#0066FF)',
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
                border: '1px solid var(--gray-20,#E5E5EB)', borderRadius: 8,
                background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                color: 'var(--gray-80,#3A3A3B)', fontFamily: 'inherit',
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
          background: 'var(--gray-5,#F9F9FC)',
          borderBottom: '1px solid var(--gray-15,#ECECEC)',
        }}>
          {HEADERS.map((h) => (
            <button
              key={h.label}
              onClick={h.sortable ? () => setSortDir(d => d === 'desc' ? 'asc' : 'desc') : undefined}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                fontSize: 12, fontWeight: 500, color: 'var(--gray-60,#636367)',
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
          <div style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--gray-50,#8E8E94)', fontSize: 14 }}>
            Loading usage data…
          </div>
        ) : sorted.length === 0 ? (
          <div style={{ padding: '56px 24px', textAlign: 'center' }}>
            <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--gray-80,#3A3A3B)', margin: 0 }}>No usage data for this period</p>
            <p style={{ fontSize: 13, color: 'var(--gray-50,#8E8E94)', marginTop: 4 }}>Try expanding the date range.</p>
          </div>
        ) : (
          sorted.map(r => <UsageRow key={r.date} record={r} />)
        )}
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
