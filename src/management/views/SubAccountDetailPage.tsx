import { useEffect, useId, useState } from 'react';
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
import notificationsService from '../../services/notifications.service';
import { exportAsCSV } from '../../utils/exportUtils';
import { StatusBadge } from '../../components/StatusBadge';
import Button from '../../components/Button';
import { EditClientNameButton } from '../../components/EditClientNameModal';
import { apiErrorMessage } from '../../utils/apiError';
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
};

interface SubAccountDetailPageProps {
  backPath?: string;
  service?: SubAccountService;
  showClientName?: boolean;
  showStorageLimit?: boolean;
}

const PER_PAGE = 20;

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

const DetailField = ({ label, value }: { label: string; value?: string | number | null }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-xs text-gray-400 uppercase tracking-wide">{label}</span>
    <span className="text-sm text-gray-800">{value ?? '—'}</span>
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
}: SubAccountDetailPageProps) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { updateSubAccountStorageLimit: updateLimit, updateSubAccountName: updateName } = service;

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

  useEffect(() => {
    service
      .getSubAccountById(id!)
      .then((data) => {
        setAccount(data);
      })
      .catch((e) => notificationsService.error({ text: apiErrorMessage(e, 'Failed to load account') }))
      .finally(() => setLoading(false));
  }, [id]);

  const fetchUsages = async () => {
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
  };

  useEffect(() => {
    fetchUsages();
  }, [id, from, to, page]);

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

  const handleRename = async (update: (id: string, name: string) => Promise<void>, name: string) => {
    await update(id!, name);
    setAccount((current) => (current ? { ...current, name } : current));
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
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-gray-300 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!account) return null;

  const storageLimit = toStorageLimit(account.storageQuotaTb, account.usageAlertTb);

  const tabClass = (t: typeof tab) =>
    `px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
      tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-800'
    }`;

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

      {/* Tabs + content */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100 px-2">
          <button className={tabClass('usage')} onClick={() => setTab('usage')}>
            Usage
          </button>
          <button className={tabClass('account')} onClick={() => setTab('account')}>
            Account Details
          </button>
        </div>

        {tab === 'usage' && (
          <div className="p-5 flex flex-col gap-5">
            {/* Date range */}
            <div className="flex items-center gap-2 flex-wrap">
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
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <DownloadSimple size={14} />
                {exporting ? 'Exporting…' : 'Export CSV'}
              </button>
            </div>

            {/* Chart */}
            {!usagesLoading && chartData.length > 0 && <StorageOverTimeChart data={chartData} />}

            {/* Usage table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-gray-50 border-y border-gray-100">
                    {[
                      'Start Time',
                      'End Time',
                      'Active Storage (TB)',
                      'Deleted Storage (TB)',
                      'Storage Wrote (TB)',
                      'Storage Read (TB)',
                    ].map((h) => (
                      <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {usagesLoading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10">
                        <div className="flex flex-col items-center gap-2 text-gray-400">
                          <div className="w-5 h-5 border-2 border-gray-300 border-t-indigo-500 rounded-full animate-spin" />
                          <span className="text-xs">Loading…</span>
                        </div>
                      </td>
                    </tr>
                  ) : usages.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-sm text-gray-400">
                        No usage data for this period
                      </td>
                    </tr>
                  ) : (
                    usages.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">{fmtDate(u.startTime)}</td>
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">{fmtDate(u.endTime)}</td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-700">{fmt(u.activeStorage)}</td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-700">{fmt(u.deletedStorage)}</td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-700">{fmt(u.storageWrote)}</td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-700">{fmt(u.storageRead)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                <span className="text-xs text-gray-400">
                  {page * PER_PAGE + 1}–{Math.min((page + 1) * PER_PAGE, totalUsages)} of {totalUsages}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    disabled={page === 0}
                    onClick={() => setPage((p) => p - 1)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <CaretLeft size={14} /> Prev
                  </button>
                  <span className="px-3 py-1.5 text-sm text-gray-500">
                    {page + 1} / {totalPages}
                  </span>
                  <button
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next <CaretRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'account' && (
          <div className="p-6 flex flex-col gap-6">
            {/* Read-only info */}
            <div className="grid grid-cols-2 gap-x-10 gap-y-4 lg:grid-cols-4 pb-5 border-b border-gray-100">
              {showClientName && <DetailField label="Name" value={account.name} />}
              <DetailField label="Account ID" value={id} />
              <DetailField label="Status" value={account.status} />
              <DetailField
                label="Creation Date"
                value={account.creationDate ? dayjs(account.creationDate).format('DD-MMM-YYYY') : null}
              />
              {account.partnerId ? (
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-gray-400 uppercase tracking-wide">Partner Account</span>
                  <span
                    className="text-sm text-blue-600 hover:underline cursor-pointer"
                    onClick={() => navigate(`/management/partners/${account.partnerId}`)}
                  >
                    {account.partnerName || account.partnerId}
                  </span>
                </div>
              ) : (
                <DetailField label="Partner Account" value={null} />
              )}
              <DetailField label="Email" value={account.contactEmail} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
