import { useCallback, useEffect, useId, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  ArrowLeft,
  Database,
  Package,
  CaretLeft,
  CaretRight,
  DownloadSimple,
  WarningIcon,
} from '@phosphor-icons/react';
import { managementService, SubAccountDetail, SubAccountUsage } from '../services/management.service';
import { StorageOverTimeChart } from '../components/StorageOverTimeChart';
import { UsageDateRange } from '../components/UsageDateRange';
import { MigrateToNewConsoleModal } from '../components/MigrateToNewConsoleModal';
import notificationsService from '../../services/notifications.service';
import { exportAsCSV } from '../../utils/exportUtils';
import { StatusBadge } from '../../components/StatusBadge';
import Button from '../../components/Button';
import { EditClientNameButton } from '../../components/EditClientNameModal';
import { DeleteEntityButton, Emphasis } from '../components/DeleteEntityButton';
import { apiErrorMessage } from '../../utils/apiError';
import { T, card } from '../../sub-account/tokens';
import {
  isSameStorageLimit,
  isValidStorageLimit,
  MAX_STORAGE_QUOTA_TB,
  MIN_STORAGE_QUOTA_TB,
  StorageLimit,
  StorageLimitType,
  STORAGE_LIMIT_TYPING_PATTERN,
  STORAGE_LIMIT_LABELS,
  storageLimitValueTb,
  toStorageFields,
  toStorageLimit,
} from '../../utils/storageLimits';

type SubAccountService = Pick<typeof managementService, 'getSubAccountById' | 'getSubAccountUsages'> & {
  updateSubAccountStorageLimit?: (id: string, limit: StorageLimit) => Promise<void>;
  updateSubAccountName?: (id: string, name: string) => Promise<void>;
  migrateSubAccountToNewConsole?: (id: string, email: string) => Promise<void>;
};

interface SubAccountDetailPageProps {
  backPath?: string;
  service?: SubAccountService;
  showClientName?: boolean;
  showStorageLimit?: boolean;
  deleteSubAccount?: (id: string) => Promise<void>;
}

const PER_PAGE = 20;

const TABS = [
  { key: 'usage', label: 'Usage' },
  { key: 'account', label: 'Account Details' },
] as const;

const StatCard = ({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) => (
  <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4">
    <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0">
      {icon}
    </div>
    <div>
      <div className="text-lg font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-400">{label}</div>
    </div>
  </div>
);

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.14em',
  color: T.gray60,
};

const pageButtonStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  height: 32,
  padding: '0 12px',
  fontSize: 13,
  fontWeight: 500,
  color: T.gray80,
  border: `1px solid ${T.gray20}`,
  borderRadius: 8,
  background: T.white,
};

const headerCellStyle: React.CSSProperties = {
  padding: '12px 16px',
  fontSize: 10,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: T.gray50,
  borderBottom: `1px solid ${T.gray15}`,
  background: T.gray5,
  whiteSpace: 'nowrap',
};

const USAGE_COLUMNS = [
  { label: 'Start Time', align: 'left' },
  { label: 'End Time', align: 'left' },
  { label: 'Active Storage (TB)', align: 'right' },
  { label: 'Deleted Storage (TB)', align: 'right' },
  { label: 'Storage Wrote (TB)', align: 'right' },
  { label: 'Storage Read (TB)', align: 'right' },
] as const;

const emptyValue = <span style={{ color: T.gray20 }}>—</span>;

const DetailField = ({ label, children }: { label: string; children?: React.ReactNode }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
    <span style={labelStyle}>{label}</span>
    <span style={{ fontSize: 14, color: T.gray100, overflowWrap: 'anywhere' }}>{children ?? emptyValue}</span>
  </div>
);

const LIMIT_TYPES: StorageLimitType[] = ['none', 'alert', 'quota'];

const LIMIT_HELP: Record<StorageLimitType, string> = {
  none: 'Uploads are never restricted and no warning is shown.',
  alert: 'Shows a warning in the console when usage reaches this amount. Uploads are never blocked.',
  quota:
    'New uploads are blocked once usage reaches this amount. Existing data can still be read, downloaded and deleted.',
};

const LIMIT_RANGE: Record<Exclude<StorageLimitType, 'none'>, string> = {
  alert: 'Greater than 0, up to 2 decimals',
  quota: `Whole number from ${MIN_STORAGE_QUOTA_TB} to ${MAX_STORAGE_QUOTA_TB}`,
};

const UsageAlertWarning = ({ used, limit }: { used: number; limit: StorageLimit }) => {
  if (limit.type !== 'alert' || used < limit.valueTb) return null;

  return (
    <div role="alert" className="rounded-xl border p-4 flex items-start gap-3 bg-orange/10 border-orange/40">
      <WarningIcon size={20} weight="fill" className="flex-shrink-0 mt-0.5 text-orange" />
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold text-gray-100">Usage alert reached</span>
        <span className="text-xs text-gray-80">
          {fmt(used, 2)} TB in use · usage alert {limit.valueTb} TB. Uploads keep working; a usage alert never blocks
          them.
        </span>
      </div>
    </div>
  );
};

const StorageLimitCard = ({
  limit,
  used,
  onSave,
}: {
  limit: StorageLimit;
  used: number;
  onSave?: (limit: StorageLimit) => Promise<void>;
}) => {
  const savedValue = String(storageLimitValueTb(limit) ?? '');
  const [type, setType] = useState<StorageLimitType>(limit.type);
  const [value, setValue] = useState(savedValue);
  const [busy, setBusy] = useState(false);
  const inputId = useId();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setType(limit.type);
    setValue(savedValue);
  }, [limit.type, savedValue]);

  const summary = (
    <div>
      <h2 className="text-base font-medium text-gray-100">Storage limit</h2>
      <p className="text-sm text-gray-60 mt-0.5">
        {limit.type === 'none' ? (
          <span className="text-gray-100">{STORAGE_LIMIT_LABELS.none}</span>
        ) : (
          <>
            <span className="text-gray-100">{STORAGE_LIMIT_LABELS[limit.type]}</span> of{' '}
            <span className="text-gray-100">{limit.valueTb} TB</span>
          </>
        )}
        {' · '}
        <span className="text-gray-100">{fmt(used, 2)} TB</span> currently in use
      </p>
    </div>
  );

  if (!onSave) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-5 flex flex-col gap-1">
        {summary}
        <p className="text-xs text-gray-60">{LIMIT_HELP[limit.type]}</p>
      </div>
    );
  }

  const invalid = type !== 'none' && value !== '' && !isValidStorageLimit(type, value);
  let next: StorageLimit | null = null;
  if (type === 'none') {
    next = { type };
  } else if (value !== '' && !invalid) {
    next = { type, valueTb: Number(value) };
  }
  const changed = next != null && !isSameStorageLimit(next, limit);

  const notes: string[] = [];
  if (limit.type !== 'none' && type !== limit.type) {
    notes.push(
      `Saving ${type === 'none' ? 'removes' : 'replaces'} the current ${STORAGE_LIMIT_LABELS[limit.type].toLowerCase()} (${limit.valueTb} TB).`,
    );
  }
  if (changed && next?.type === 'quota' && used >= next.valueTb) {
    notes.push(
      `This account already uses ${fmt(used, 2)} TB. New uploads will be blocked until usage drops below ${next.valueTb} TB.`,
    );
  }

  const changeType = (nextType: StorageLimitType) => {
    setType(nextType);
    if (nextType === limit.type) setValue(savedValue);
    else if (nextType !== 'none' && !STORAGE_LIMIT_TYPING_PATTERN[nextType].test(value)) setValue('');
  };

  const save = async () => {
    if (!next) return;
    setBusy(true);
    try {
      await onSave(next);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 flex flex-col gap-3">
      {summary}

      <fieldset disabled={busy} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <legend className="sr-only">Limit type</legend>
        {LIMIT_TYPES.map((t) => {
          const selected = type === t;
          const current = limit.type === t;
          return (
            <div
              key={t}
              className={`flex flex-col rounded-lg border transition-colors [&:has(:focus-visible)]:ring-2 [&:has(:focus-visible)]:ring-primary/40 ${
                selected ? 'border-primary ring-1 ring-primary bg-primary/5' : 'border-gray-10 hover:border-gray-30'
              } ${busy ? 'opacity-60' : ''}`}
            >
              <label className={`flex flex-col gap-1 p-3 ${busy ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                <input
                  type="radio"
                  name="storage-limit-type"
                  value={t}
                  checked={selected}
                  onChange={() => changeType(t)}
                  className="sr-only"
                />
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border ${
                      selected ? 'border-primary' : 'border-gray-30'
                    }`}
                  >
                    {selected && <span className="h-2 w-2 rounded-full bg-primary" />}
                  </span>
                  <span className={`text-base ${selected ? 'font-semibold text-primary' : 'font-medium text-gray-80'}`}>
                    {STORAGE_LIMIT_LABELS[t]}
                  </span>
                  {current && (
                    <span className="ml-auto rounded-full bg-gray-5 px-2 py-0.5 text-xs font-medium text-gray-60">
                      Current
                    </span>
                  )}
                </span>
                <span className="pl-6 text-xs text-gray-60">{LIMIT_HELP[t]}</span>
              </label>

              {t !== 'none' && (
                <div
                  aria-hidden={!selected}
                  className={`mt-auto flex-col gap-1 px-3 pb-3 pl-9 ${selected ? 'flex' : 'hidden sm:flex sm:invisible'}`}
                >
                  <div
                    className={`flex items-center rounded-lg border bg-white transition-colors ${
                      selected && invalid ? 'border-red-dark' : 'border-gray-10 focus-within:border-primary'
                    }`}
                  >
                    <input
                      id={selected ? inputId : undefined}
                      type="text"
                      inputMode={t === 'alert' ? 'decimal' : 'numeric'}
                      value={selected ? value : ''}
                      tabIndex={selected ? undefined : -1}
                      placeholder={t === 'alert' ? 'e.g. 7.5' : 'e.g. 10'}
                      aria-label={`${STORAGE_LIMIT_LABELS[t]} in TB`}
                      aria-describedby={selected ? `${inputId}-hint` : undefined}
                      aria-invalid={selected && invalid}
                      onChange={(e) => {
                        if (STORAGE_LIMIT_TYPING_PATTERN[t].test(e.target.value)) setValue(e.target.value);
                      }}
                      className="w-full min-w-0 bg-transparent px-3 py-1.5 text-sm text-gray-100 outline-none"
                    />
                    <span aria-hidden className="pr-3 text-sm text-gray-60">
                      TB
                    </span>
                  </div>
                  <span
                    id={selected ? `${inputId}-hint` : undefined}
                    className={`text-xs ${selected && invalid ? 'text-red-dark' : 'text-gray-60'}`}
                  >
                    {LIMIT_RANGE[t]}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </fieldset>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        {notes.length > 0 && (
          <div
            role="status"
            className="flex flex-col gap-1 rounded-lg border border-orange/40 bg-orange/10 px-3 py-2 sm:flex-1"
          >
            {notes.map((note) => (
              <p key={note} className="flex items-start gap-1.5 text-xs text-gray-80">
                <WarningIcon size={14} weight="fill" className="flex-shrink-0 mt-px text-orange" aria-hidden />
                {note}
              </p>
            ))}
          </div>
        )}
        <Button size="medium" className="self-end sm:self-auto" disabled={!changed} loading={busy} onClick={save}>
          {busy ? 'Saving…' : 'Save limit'}
        </Button>
      </div>
    </div>
  );
};

const fmt = (n: number, decimals = 8) => n.toFixed(decimals);
const fmtDate = (s: string) => (dayjs(s).isValid() ? dayjs(s).format('DD-MMM-YYYY HH:mm') : s);
const fmtChartDate = (s: string) => (dayjs(s).isValid() ? dayjs(s).format('DD MMM') : s);

export const SubAccountDetailPage = ({
  backPath = '/management/accounts',
  service = managementService,
  showClientName = false,
  showStorageLimit = false,
  deleteSubAccount,
}: SubAccountDetailPageProps) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    updateSubAccountStorageLimit: updateLimit,
    updateSubAccountName: updateName,
    migrateSubAccountToNewConsole: migrateToNewConsole,
  } = service;

  const [account, setAccount] = useState<SubAccountDetail | null>(null);
  const [usages, setUsages] = useState<SubAccountUsage[]>([]);
  const [totalUsages, setTotalUsages] = useState(0);
  const [page, setPage] = useState(0);
  const [tab, setTab] = useState<'usage' | 'account'>('usage');
  const MAX_RANGE_DAYS = 31;
  const [from, setFrom] = useState(() => dayjs().subtract(MAX_RANGE_DAYS, 'day').format('YYYY-MM-DD'));
  const [to, setTo] = useState(() => dayjs().format('YYYY-MM-DD'));
  const [loading, setLoading] = useState(true);
  const [usagesLoading, setUsagesLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [migrateOpen, setMigrateOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    service
      .getSubAccountById(id!)
      .then((data) => {
        setAccount(data);
      })
      .catch((e) => notificationsService.error({ text: apiErrorMessage(e, 'Failed to load account') }))
      .finally(() => setLoading(false));
  }, [id, service]);

  const fetchUsages = useCallback(async () => {
    setUsagesLoading(true);
    try {
      const res = await service.getSubAccountUsages(id!, { from, to, page, perPage: PER_PAGE });
      const sorted = res.items.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
      setUsages(sorted);
      setTotalUsages(res.totalItems);
    } catch (e) {
      notificationsService.error({ text: apiErrorMessage(e, 'Failed to load usages') });
    } finally {
      setUsagesLoading(false);
    }
  }, [service, id, from, to, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsages();
  }, [fetchUsages]);

  const exportUsages = async () => {
    setExporting(true);
    try {
      let all: SubAccountUsage[] = [];
      let p = 0;
      while (true) {
        const res = await service.getSubAccountUsages(id!, { from, to, page: p, perPage: 500 });
        all = all.concat(res.items);
        if (all.length >= res.totalItems || res.items.length === 0) break;
        p++;
      }
      all.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

      const filename = `usages_${account?.contactEmail ?? id}_${from}_${to}`;
      const numericFields = new Set([
        'activeStorage',
        'deletedStorage',
        'storageWrote',
        'storageRead',
        'egress',
        'ingress',
      ]);
      const headers: (keyof SubAccountUsage)[] = [
        'id',
        'startTime',
        'endTime',
        'activeStorage',
        'deletedStorage',
        'storageWrote',
        'storageRead',
        'activeObjects',
        'deletedObjects',
        'egress',
        'ingress',
        'apiCalls',
      ];
      const data = all.map((u) => Object.fromEntries(headers.map((h) => [h, u[h] ?? ''])));
      exportAsCSV(data, numericFields, filename);
    } catch (e) {
      notificationsService.error({ text: apiErrorMessage(e, 'Export failed') });
    } finally {
      setExporting(false);
    }
  };

  const applyLimitChange = async (update: (id: string, limit: StorageLimit) => Promise<void>, limit: StorageLimit) => {
    try {
      await update(id!, limit);
      setAccount((current) => (current ? { ...current, ...toStorageFields(limit) } : current));
      notificationsService.success({
        text:
          limit.type === 'none'
            ? 'Storage limit removed'
            : `${STORAGE_LIMIT_LABELS[limit.type]} set to ${limit.valueTb} TB`,
      });
    } catch (e) {
      notificationsService.error({ text: apiErrorMessage(e, 'Failed to update the storage limit') });
    }
  };

  const handleDelete = async (remove: (id: string) => Promise<void>) => {
    setIsDeleting(true);
    try {
      await remove(id!);
      notificationsService.success({ text: 'Sub-account deleted' });
      await navigate(backPath);
    } catch (e) {
      notificationsService.error({ text: apiErrorMessage(e, 'Failed to delete sub-account') });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRename = async (update: (id: string, name: string) => Promise<void>, name: string) => {
    await update(id!, name);
    setAccount((current) => (current ? { ...current, name } : current));
  };

  const handleMigrate = async (migrate: (id: string, email: string) => Promise<void>, email: string) => {
    await migrate(id!, email);
    setAccount((current) => (current ? { ...current, newConsoleMigrationEligible: false } : current));
  };

  const totalPages = Math.ceil(totalUsages / PER_PAGE);
  const latestUsage = usages[0];

  const chartData = usages
    .slice()
    .reverse()
    .map((u) => ({
      date: fmtChartDate(u.startTime),
      active: parseFloat(u.activeStorage.toFixed(2)),
      deleted: parseFloat(u.deletedStorage.toFixed(2)),
    }));

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
        <div className="w-5 h-5 border-2 border-gray-20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!account) return null;

  const storageLimit = toStorageLimit(account.storageQuotaTb, account.usageAlertTb);

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => navigate(backPath)}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm hover:bg-gray-50 transition-colors flex-shrink-0"
        >
          <ArrowLeft size={14} />
          Back
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className={`text-lg font-bold text-gray-900${showClientName ? '' : ' font-mono'}`}>
              {showClientName ? (account.name ?? '—') : account.id}
            </h1>
            {updateName && account.status !== 'DELETED' && (
              <EditClientNameButton
                currentName={account.name ?? null}
                onSubmit={(name) => handleRename(updateName, name)}
              />
            )}
            <StatusBadge status={account.status} />
          </div>
          {account.contactEmail && <p className="text-sm text-gray-400 mt-0.5">{account.contactEmail}</p>}
        </div>
        {deleteSubAccount && account.status !== 'DELETED' && account.status !== 'PENDING_DELETION' && (
          <div className="ml-auto flex-shrink-0">
            <DeleteEntityButton
              title="Delete sub-account permanently?"
              description={
                <>
                  This will permanently delete <Emphasis>{account.contactEmail ?? account.id}</Emphasis> and its{' '}
                  <Emphasis>{fmt(account.activeStorage, 4)} TB</Emphasis> of active storage at the storage provider.
                  This action cannot be undone.
                </>
              }
              isDeleting={isDeleting}
              onConfirm={() => handleDelete(deleteSubAccount)}
            />
          </div>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={<Database size={20} weight="duotone" className="text-indigo-600" />}
          value={`${fmt(account.activeStorage, 4)} TB`}
          label="Total Current Storage"
        />
        <StatCard
          icon={<Package size={20} weight="duotone" className="text-indigo-600" />}
          value={latestUsage ? latestUsage.activeObjects.toLocaleString() : '—'}
          label="Total Current Objects"
        />
        <StatCard
          icon={<Database size={20} weight="duotone" className="text-indigo-600" />}
          value={`${fmt(account.deletedStorage, 4)} TB`}
          label="Deleted Storage"
        />
        <StatCard
          icon={<Package size={20} weight="duotone" className="text-indigo-600" />}
          value={account.creationDate ? dayjs(account.creationDate).format('DD-MMM-YYYY') : '—'}
          label="Customer Since"
        />
      </div>

      {showStorageLimit && (
        <>
          <UsageAlertWarning used={account.activeStorage} limit={storageLimit} />
          <StorageLimitCard
            limit={storageLimit}
            used={account.activeStorage}
            onSave={updateLimit && ((limit) => applyLimitChange(updateLimit, limit))}
          />
        </>
      )}

      <div style={{ ...card, borderRadius: 16, overflow: 'hidden' }}>
        <div
          role="tablist"
          style={{ display: 'flex', gap: 8, padding: '0 16px', borderBottom: `1px solid ${T.gray15}` }}
        >
          {TABS.map(({ key, label }) => {
            const active = tab === key;
            return (
              <button
                key={key}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(key)}
                style={{
                  padding: '14px 8px',
                  marginBottom: -1,
                  fontSize: 14,
                  fontWeight: active ? 600 : 500,
                  color: active ? T.primary : T.gray60,
                  background: 'transparent',
                  border: 'none',
                  borderBottom: `2px solid ${active ? T.primary : 'transparent'}`,
                  cursor: 'pointer',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {tab === 'usage' && (
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <UsageDateRange
                from={from}
                to={to}
                maxDays={MAX_RANGE_DAYS}
                onChange={(range) => {
                  setFrom(range.from);
                  setTo(range.to);
                  setPage(0);
                }}
              />
              <button
                disabled={exporting}
                onClick={() => exportUsages()}
                style={{
                  ...pageButtonStyle,
                  marginLeft: 'auto',
                  cursor: exporting ? 'not-allowed' : 'pointer',
                  opacity: exporting ? 0.4 : 1,
                }}
              >
                <DownloadSimple size={14} />
                {exporting ? 'Exporting…' : 'Export CSV'}
              </button>
            </div>

            {!usagesLoading && chartData.length > 0 && <StorageOverTimeChart data={chartData} />}

            <div style={{ overflowX: 'auto', border: `1px solid ${T.gray15}`, borderRadius: 12, position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 2,
                  overflow: 'hidden',
                  transition: 'opacity 300ms',
                  opacity: usagesLoading ? 1 : 0,
                }}
              >
                <div className="animate-loading-bar" style={{ height: '100%', background: T.primary }} />
              </div>
              <table
                style={{ width: '100%', fontSize: 14, textAlign: 'left', borderCollapse: 'separate', borderSpacing: 0 }}
              >
                <thead>
                  <tr>
                    {USAGE_COLUMNS.map((c) => (
                      <th key={c.label} style={{ ...headerCellStyle, textAlign: c.align }}>
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody style={{ transition: 'opacity 200ms', opacity: usagesLoading ? 0.4 : 1 }}>
                  {usages.length === 0 ? (
                    <tr>
                      <td
                        colSpan={USAGE_COLUMNS.length}
                        style={{
                          textAlign: 'center',
                          padding: '64px 0',
                          color: T.gray50,
                          fontSize: 14,
                          fontWeight: 500,
                        }}
                      >
                        {!usagesLoading && 'No usage data for this period'}
                      </td>
                    </tr>
                  ) : (
                    usages.map((u, idx) => {
                      const cellStyle: React.CSSProperties = {
                        padding: '14px 16px',
                        borderBottom: idx < usages.length - 1 ? `1px solid ${T.gray15}` : 'none',
                        whiteSpace: 'nowrap',
                      };
                      const numberStyle: React.CSSProperties = {
                        ...cellStyle,
                        textAlign: 'right',
                        color: T.gray80,
                        fontVariantNumeric: 'tabular-nums',
                      };
                      return (
                        <tr key={u.id}>
                          <td style={{ ...cellStyle, color: T.gray50 }}>{fmtDate(u.startTime)}</td>
                          <td style={{ ...cellStyle, color: T.gray50 }}>{fmtDate(u.endTime)}</td>
                          <td style={numberStyle}>{fmt(u.activeStorage)}</td>
                          <td style={numberStyle}>{fmt(u.deletedStorage)}</td>
                          <td style={numberStyle}>{fmt(u.storageWrote)}</td>
                          <td style={numberStyle}>{fmt(u.storageRead)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: T.gray50 }}>
                  Showing {page * PER_PAGE + 1}–{Math.min((page + 1) * PER_PAGE, totalUsages)} of {totalUsages}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    disabled={page === 0}
                    onClick={() => setPage((p) => p - 1)}
                    style={{
                      ...pageButtonStyle,
                      cursor: page === 0 ? 'not-allowed' : 'pointer',
                      opacity: page === 0 ? 0.4 : 1,
                    }}
                  >
                    <CaretLeft size={14} /> Prev
                  </button>
                  <span style={{ padding: '0 8px', fontSize: 13, color: T.gray50 }}>
                    {page + 1} / {totalPages}
                  </span>
                  <button
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                    style={{
                      ...pageButtonStyle,
                      cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
                      opacity: page >= totalPages - 1 ? 0.4 : 1,
                    }}
                  >
                    Next <CaretRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'account' && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '24px 40px',
                padding: '28px 32px',
              }}
            >
              {showClientName && <DetailField label="Name">{account.name}</DetailField>}
              <DetailField label="Account ID">
                <span style={{ fontFamily: 'monospace', fontSize: 13 }}>{id}</span>
              </DetailField>
              <DetailField label="Status">
                <StatusBadge status={account.status} />
              </DetailField>
              <DetailField label="Creation Date">
                {account.creationDate ? dayjs(account.creationDate).format('DD-MMM-YYYY') : null}
              </DetailField>
              <DetailField label="Partner Account">
                {account.partnerId && (
                  <button
                    onClick={() => navigate(`/management/partners/${account.partnerId}`)}
                    style={{
                      padding: 0,
                      fontSize: 14,
                      color: T.primary,
                      textDecoration: 'underline',
                      textUnderlineOffset: 2,
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {account.partnerName || account.partnerId}
                  </button>
                )}
              </DetailField>
              <DetailField label="Email">{account.contactEmail}</DetailField>
            </div>

            {migrateToNewConsole && account.newConsoleMigrationEligible && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 16,
                  padding: '20px 32px',
                  borderTop: `1px solid ${T.gray15}`,
                  background: T.gray5,
                }}
              >
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: T.gray100, margin: 0 }}>New console</p>
                  <p style={{ fontSize: 13, color: T.gray60, margin: '2px 0 0' }}>
                    This sub-account has no users yet and can only use the old console.
                  </p>
                </div>
                <Button size="medium" onClick={() => setMigrateOpen(true)}>
                  Migrate to new console
                </Button>
                <MigrateToNewConsoleModal
                  isOpen={migrateOpen}
                  currentEmail={account.contactEmail}
                  onClose={() => setMigrateOpen(false)}
                  onSubmit={(email) => handleMigrate(migrateToNewConsole, email)}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
