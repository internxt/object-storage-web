import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { ArrowLeft, Database, Package, CaretLeft, CaretRight, DownloadSimple, WarningIcon } from '@phosphor-icons/react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { managementService, SubAccountDetail, SubAccountUsage } from '../services/management.service';
import notificationsService from '../../services/notifications.service';
import { exportAsCSV } from '../../utils/exportUtils';
import { StatusBadge } from '../../components/StatusBadge';
import { EditClientNameButton } from '../../components/EditClientNameModal';
import { apiErrorMessage } from '../../utils/apiError';
import { getStorageLimitStatus } from '../../utils/storageLimits';

type SubAccountService = Pick<typeof managementService, 'getSubAccountById' | 'getSubAccountUsages'> & {
  updateSubAccountStorageQuota?: (id: string, limitTb: number | null) => Promise<void>;
  updateSubAccountUsageAlert?: (id: string, usageAlertTb: number | null) => Promise<void>;
  updateSubAccountName?: (id: string, name: string) => Promise<void>;
};

interface SubAccountDetailPageProps {
  backPath?: string;
  service?: SubAccountService;
  showClientName?: boolean;
}

const PER_PAGE = 20;

const StatCard = ({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) => (
  <div className='bg-white rounded-xl shadow-sm p-5 flex items-center gap-4'>
    <div className='w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0'>
      {icon}
    </div>
    <div>
      <div className='text-lg font-bold text-gray-900'>{value}</div>
      <div className='text-xs text-gray-400'>{label}</div>
    </div>
  </div>
);

const DetailField = ({ label, value }: { label: string; value?: string | number | null }) => (
  <div className='flex flex-col gap-0.5'>
    <span className='text-xs text-gray-400 uppercase tracking-wide'>{label}</span>
    <span className='text-sm text-gray-800'>{value ?? '—'}</span>
  </div>
);

const MIN_STORAGE_QUOTA_TB = 1;
const MAX_STORAGE_QUOTA_TB = 500;
// `type=number` accepts scientific notation and signs; a quota is always a whole number of TB.
const BLOCKED_QUOTA_KEYS = ['e', 'E', '+', '-', '.', ','];
const QUOTA_INPUT = /^\d*$/;
const USAGE_ALERT_INPUT = /^\d*(\.\d{0,2})?$/;

const WARNING_TONES = {
  alert: {
    box: 'bg-amber-50 border-amber-200',
    icon: 'text-amber-600',
    title: 'text-amber-900',
    body: 'text-amber-800',
    heading: 'Usage alert reached',
    note: 'New uploads will be blocked once the storage quota is reached.',
  },
  quota: {
    box: 'bg-red-50 border-red-200',
    icon: 'text-red-600',
    title: 'text-red-900',
    body: 'text-red-800',
    heading: 'Storage quota reached',
    note: 'New uploads are blocked. Existing data can still be read, downloaded and deleted.',
  },
};

const UsageAlertWarning = ({ used, usageAlert, quota }: { used: number; usageAlert: number | null; quota: number | null }) => {
  const { alertReached, quotaReached } = getStorageLimitStatus(used, quota, usageAlert);
  if (!alertReached) return null;
  const tone = WARNING_TONES[quotaReached ? 'quota' : 'alert'];

  return (
    <div role='alert' className={`rounded-xl border p-4 flex items-start gap-3 ${tone.box}`}>
      <WarningIcon size={20} weight='fill' className={`flex-shrink-0 mt-0.5 ${tone.icon}`} />
      <div className='flex flex-col gap-0.5'>
        <span className={`text-sm font-semibold ${tone.title}`}>{tone.heading}</span>
        <span className={`text-xs ${tone.body}`}>
          {fmt(used, 2)} TB in use · usage alert {usageAlert} TB · storage quota {quota != null ? `${quota} TB` : 'not set'}.{' '}
          {tone.note}
        </span>
      </div>
    </div>
  );
};

const LimitEditor = ({
  title,
  description,
  limit,
  placeholder,
  min,
  max,
  step,
  inputPattern,
  blockedKeys = [],
  decimal = false,
  validate,
  saveLabel,
  removeLabel,
  removeBlockedReason,
  disabled = false,
  onSave,
  onRemove,
}: {
  title: React.ReactNode;
  description: string;
  limit: number | null;
  placeholder: string;
  min?: number;
  max?: number;
  step?: number;
  inputPattern: RegExp;
  blockedKeys?: string[];
  decimal?: boolean;
  validate: (value: string, parsed: number) => string | null;
  saveLabel: string;
  removeLabel: string;
  removeBlockedReason?: string;
  disabled?: boolean;
  onSave: (value: number) => Promise<void>;
  onRemove: () => Promise<void>;
}) => {
  const [value, setValue] = useState(limit != null ? String(limit) : '');
  const [busy, setBusy] = useState(false);

  useEffect(() => setValue(limit != null ? String(limit) : ''), [limit]);

  const parsed = Number(value);
  const error = value !== '' ? validate(value, parsed) : null;
  const canSave = !busy && value !== '' && error == null && parsed !== limit;

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className='flex items-baseline justify-between gap-4'>
        <div className='min-w-0'>
          {title}
          <p className='text-xs text-gray-400 mt-0.5'>{description}</p>
        </div>
        {limit != null && (
          <button
            disabled={busy || removeBlockedReason != null}
            title={removeBlockedReason}
            onClick={() => run(onRemove)}
            className='shrink-0 whitespace-nowrap text-xs font-medium text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors'
          >
            {removeLabel}
          </button>
        )}
      </div>

      <div className='flex items-center gap-2 flex-wrap'>
        <input
          type={decimal ? 'text' : 'number'}
          inputMode={decimal ? 'decimal' : undefined}
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={busy || disabled}
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (blockedKeys.includes(e.key)) e.preventDefault();
          }}
          onChange={(e) => {
            if (inputPattern.test(e.target.value)) setValue(e.target.value);
          }}
          className='w-32 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-indigo-400 disabled:bg-gray-50'
        />
        <span className='text-sm text-gray-700'>TB</span>
        <button
          disabled={!canSave}
          onClick={() => run(() => onSave(parsed))}
          className='flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors'
        >
          {busy ? 'Saving…' : saveLabel}
        </button>
        {error && <span className='text-xs text-red'>{error}</span>}
      </div>
    </>
  );
};

const usageAlertDescription = (usageAlert: number | null, quota: number | null) => {
  if (usageAlert != null) {
    return `A warning shows when usage reaches ${usageAlert} TB. Uploads keep working until the storage quota.`;
  }
  if (quota == null) return 'Set a storage quota first. The usage alert must be below it.';
  return 'Not set. Show a warning in the console when usage reaches this level, before the storage quota.';
};

const StorageLimitsCard = ({
  quota,
  used,
  usageAlert,
  onSaveQuota,
  onRemoveQuota,
  onSaveUsageAlert,
  onRemoveUsageAlert,
}: {
  quota: number | null;
  used: number;
  usageAlert: number | null;
  onSaveQuota: (limitTb: number) => Promise<void>;
  onRemoveQuota: () => Promise<void>;
  onSaveUsageAlert?: (usageAlertTb: number) => Promise<void>;
  onRemoveUsageAlert?: () => Promise<void>;
}) => (
  <div className='bg-white rounded-xl shadow-sm p-5 grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-0'>
    <div className='flex flex-col gap-3 lg:pr-8'>
      <LimitEditor
        title={<h2 className='text-sm font-semibold text-gray-900'>Storage Quota</h2>}
        description={
          quota == null
            ? 'No limit. This account can keep uploading without restriction.'
            : `Limited to ${quota} TB. ${fmt(used, 2)} TB currently in use.`
        }
        limit={quota}
        placeholder='No limit'
        min={MIN_STORAGE_QUOTA_TB}
        max={MAX_STORAGE_QUOTA_TB}
        step={1}
        inputPattern={QUOTA_INPUT}
        blockedKeys={BLOCKED_QUOTA_KEYS}
        validate={(value, parsed) => {
          if (!/^\d+$/.test(value) || parsed < MIN_STORAGE_QUOTA_TB || parsed > MAX_STORAGE_QUOTA_TB) {
            return `Enter a whole number of TB between ${MIN_STORAGE_QUOTA_TB} and ${MAX_STORAGE_QUOTA_TB}`;
          }
          if (usageAlert != null && parsed <= usageAlert) {
            return `The storage quota must be above the usage alert (${usageAlert} TB). Lower the usage alert first.`;
          }
          return null;
        }}
        saveLabel='Save limit'
        removeLabel='Remove limit'
        removeBlockedReason={usageAlert != null ? 'Remove the usage alert first' : undefined}
        onSave={onSaveQuota}
        onRemove={onRemoveQuota}
      />
    </div>

    {onSaveUsageAlert && onRemoveUsageAlert && (
      <div className='flex flex-col gap-3 pt-6 border-t border-gray-100 lg:pt-0 lg:pl-8 lg:border-t-0 lg:border-l'>
        <LimitEditor
          title={<h3 className='text-sm font-semibold text-gray-900'>Usage Alert</h3>}
          description={usageAlertDescription(usageAlert, quota)}
          limit={usageAlert}
          placeholder='Not set'
          inputPattern={USAGE_ALERT_INPUT}
          decimal
          validate={(_value, parsed) => {
            if (!(parsed > 0)) return 'Enter a number of TB greater than 0';
            if (quota == null || parsed >= quota) return 'The usage alert must be below the storage quota';
            return null;
          }}
          saveLabel='Save usage alert'
          removeLabel='Remove usage alert'
          disabled={quota == null && usageAlert == null}
          onSave={onSaveUsageAlert}
          onRemove={onRemoveUsageAlert}
        />
      </div>
    )}
  </div>
);

const fmt = (n: number, decimals = 8) => n.toFixed(decimals);
const fmtDate = (s: string) => dayjs(s).isValid() ? dayjs(s).format('DD-MMM-YYYY HH:mm') : s;
const fmtChartDate = (s: string) => dayjs(s).isValid() ? dayjs(s).format('DD MMM') : s;

export const SubAccountDetailPage = ({
  backPath = '/management/accounts',
  service = managementService,
  showClientName = false,
}: SubAccountDetailPageProps) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    updateSubAccountStorageQuota: updateQuota,
    updateSubAccountUsageAlert: updateUsageAlert,
    updateSubAccountName: updateName,
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

  useEffect(() => {
    service
      .getSubAccountById(id!)
      .then((data) => {
        setAccount(data);
      })
      .catch((e) => notificationsService.error({ text: apiErrorMessage(e, 'Failed to load account') }))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetchUsages();
  }, [id, from, to, page]);

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
      const numericFields = new Set(['activeStorage', 'deletedStorage', 'storageWrote', 'storageRead', 'egress', 'ingress']);
      const headers: (keyof SubAccountUsage)[] = ['id', 'startTime', 'endTime', 'activeStorage', 'deletedStorage', 'storageWrote', 'storageRead', 'activeObjects', 'deletedObjects', 'egress', 'ingress', 'apiCalls'];
      const data = all.map((u) => Object.fromEntries(headers.map((h) => [h, u[h] ?? ''])));
      exportAsCSV(data, numericFields, filename);
    } catch (e) {
      notificationsService.error({ text: apiErrorMessage(e, 'Export failed') });
    } finally {
      setExporting(false);
    }
  };


  const applyLimitChange = async (
    action: () => Promise<void>,
    change: Partial<Pick<SubAccountDetail, 'storageQuotaTb' | 'usageAlertTb'>>,
    message: string,
  ) => {
    try {
      await action();
      setAccount((current) => (current ? { ...current, ...change } : current));
      notificationsService.success({ text: message });
    } catch (e) {
      notificationsService.error({ text: apiErrorMessage(e, 'The change could not be saved.') });
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
      <div className='flex items-center justify-center py-20'>
        <div className='w-6 h-6 border-2 border-gray-300 border-t-indigo-500 rounded-full animate-spin' />
      </div>
    );
  }

  if (!account) return null;

  const quota = account.storageQuotaTb ?? null;
  const usageAlert = account.usageAlertTb ?? null;

  const tabClass = (t: typeof tab) =>
    `px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
      tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-800'
    }`;

  return (
    <div className='flex flex-col gap-5'>
      {/* Header */}
      <div className='flex items-start gap-4'>
        <button
          onClick={() => navigate(backPath)}
          className='flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm hover:bg-gray-50 transition-colors flex-shrink-0'
        >
          <ArrowLeft size={14} />
          Back
        </button>
        <div>
          <div className='flex items-center gap-3'>
            <h1 className={`text-lg font-bold text-gray-900${showClientName ? '' : ' font-mono'}`}>
              {showClientName ? (account.name ?? '—') : account.id}
            </h1>
            {updateName && account.status !== 'DELETED' && (
              <EditClientNameButton currentName={account.name ?? null} onSubmit={(name) => handleRename(updateName, name)} />
            )}
            <StatusBadge status={account.status} />
          </div>
          {account.contactEmail && (
            <p className='text-sm text-gray-400 mt-0.5'>{account.contactEmail}</p>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
        <StatCard
          icon={<Database size={20} weight='duotone' className='text-indigo-600' />}
          value={`${fmt(account.activeStorage, 4)} TB`}
          label='Total Current Storage'
        />
        <StatCard
          icon={<Package size={20} weight='duotone' className='text-indigo-600' />}
          value={latestUsage ? latestUsage.activeObjects.toLocaleString() : '—'}
          label='Total Current Objects'
        />
        <StatCard
          icon={<Database size={20} weight='duotone' className='text-indigo-600' />}
          value={`${fmt(account.deletedStorage, 4)} TB`}
          label='Deleted Storage'
        />
        <StatCard
          icon={<Package size={20} weight='duotone' className='text-indigo-600' />}
          value={account.creationDate ? dayjs(account.creationDate).format('DD-MMM-YYYY') : '—'}
          label='Customer Since'
        />
      </div>

      <UsageAlertWarning used={account.activeStorage} usageAlert={usageAlert} quota={quota} />

      {updateQuota && (
        <StorageLimitsCard
          quota={quota}
          used={account.activeStorage}
          usageAlert={usageAlert}
          onSaveQuota={(limitTb) =>
            applyLimitChange(() => updateQuota(id!, limitTb), { storageQuotaTb: limitTb }, `Storage quota set to ${limitTb} TB`)
          }
          onRemoveQuota={() =>
            applyLimitChange(() => updateQuota(id!, null), { storageQuotaTb: null }, 'Storage quota removed')
          }
          onSaveUsageAlert={
            updateUsageAlert &&
            ((usageAlertTb) =>
              applyLimitChange(() => updateUsageAlert(id!, usageAlertTb), { usageAlertTb }, `Usage alert set to ${usageAlertTb} TB`))
          }
          onRemoveUsageAlert={
            updateUsageAlert &&
            (() => applyLimitChange(() => updateUsageAlert(id!, null), { usageAlertTb: null }, 'Usage alert removed'))
          }
        />
      )}

      {/* Tabs + content */}
      <div className='bg-white rounded-xl shadow-sm overflow-hidden'>
        <div className='flex border-b border-gray-100 px-2'>
          <button className={tabClass('usage')} onClick={() => setTab('usage')}>Usage</button>
          <button className={tabClass('account')} onClick={() => setTab('account')}>Account Details</button>
        </div>

        {tab === 'usage' && (
          <div className='p-5 flex flex-col gap-5'>
            {/* Date range */}
            <div className='flex items-center gap-2 flex-wrap'>
              <label className='text-xs text-gray-500'>From</label>
              <input
                type='date'
                value={from}
                max={dayjs(to).subtract(1, 'day').format('YYYY-MM-DD')}
                onChange={(e) => {
                  const newFrom = e.target.value;
                  setFrom(newFrom);
                  if (dayjs(to).diff(dayjs(newFrom), 'day') > MAX_RANGE_DAYS) {
                    setTo(dayjs(newFrom).add(MAX_RANGE_DAYS, 'day').format('YYYY-MM-DD'));
                  }
                  setPage(0);
                }}
                className='border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-indigo-400'
              />
              <label className='text-xs text-gray-500'>To</label>
              <input
                type='date'
                value={to}
                min={dayjs(from).add(1, 'day').format('YYYY-MM-DD')}
                max={dayjs(from).add(MAX_RANGE_DAYS, 'day').format('YYYY-MM-DD')}
                onChange={(e) => { setTo(e.target.value); setPage(0); }}
                className='border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-indigo-400'
              />
              <span className='text-xs text-gray-400'>Max {MAX_RANGE_DAYS} days</span>
              <button
                disabled={exporting}
                onClick={() => exportUsages()}
                className='ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors'
              >
                <DownloadSimple size={14} />
                {exporting ? 'Exporting…' : 'Export CSV'}
              </button>
            </div>

            {/* Chart */}
            {!usagesLoading && chartData.length > 0 && (
              <div className='border border-gray-100 rounded-xl p-4 bg-white'>
                <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3'>Storage over time (TB)</p>
                <ResponsiveContainer width='100%' height={200}>
                  <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
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
                    <YAxis tick={{ fontSize: 10, fill: '#111827' }} tickLine={false} axisLine={false} width={60} tickFormatter={(v) => `${v} TB`} />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                      formatter={(v: number) => [`${v.toFixed(2)} TB`]}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Area type='monotone' dataKey='active' name='Active Storage' stroke='#6366f1' strokeWidth={2} fill='url(#colorActive)' dot={false} />
                    <Area type='monotone' dataKey='deleted' name='Deleted Storage' stroke='#f97316' strokeWidth={2} fill='url(#colorDeleted)' dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Usage table */}
            <div className='overflow-x-auto'>
              <table className='w-full text-sm text-left'>
                <thead>
                  <tr className='bg-gray-50 border-y border-gray-100'>
                    {['Start Time', 'End Time', 'Active Storage (TB)', 'Deleted Storage (TB)', 'Storage Wrote (TB)', 'Storage Read (TB)'].map((h) => (
                      <th key={h} className='px-4 py-3 text-xs font-semibold text-gray-500 whitespace-nowrap'>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-50'>
                  {usagesLoading ? (
                    <tr>
                      <td colSpan={6} className='text-center py-10'>
                        <div className='flex flex-col items-center gap-2 text-gray-400'>
                          <div className='w-5 h-5 border-2 border-gray-300 border-t-indigo-500 rounded-full animate-spin' />
                          <span className='text-xs'>Loading…</span>
                        </div>
                      </td>
                    </tr>
                  ) : usages.length === 0 ? (
                    <tr>
                      <td colSpan={6} className='text-center py-10 text-sm text-gray-400'>No usage data for this period</td>
                    </tr>
                  ) : usages.map((u) => (
                    <tr key={u.id} className='hover:bg-gray-50 transition-colors'>
                      <td className='px-4 py-3 text-gray-600 whitespace-nowrap text-xs'>{fmtDate(u.startTime)}</td>
                      <td className='px-4 py-3 text-gray-600 whitespace-nowrap text-xs'>{fmtDate(u.endTime)}</td>
                      <td className='px-4 py-3 font-mono text-xs text-gray-700'>{fmt(u.activeStorage)}</td>
                      <td className='px-4 py-3 font-mono text-xs text-gray-700'>{fmt(u.deletedStorage)}</td>
                      <td className='px-4 py-3 font-mono text-xs text-gray-700'>{fmt(u.storageWrote)}</td>
                      <td className='px-4 py-3 font-mono text-xs text-gray-700'>{fmt(u.storageRead)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className='flex items-center justify-between pt-3 border-t border-gray-50'>
                <span className='text-xs text-gray-400'>
                  {page * PER_PAGE + 1}–{Math.min((page + 1) * PER_PAGE, totalUsages)} of {totalUsages}
                </span>
                <div className='flex items-center gap-1'>
                  <button
                    disabled={page === 0}
                    onClick={() => setPage((p) => p - 1)}
                    className='flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed'
                  >
                    <CaretLeft size={14} /> Prev
                  </button>
                  <span className='px-3 py-1.5 text-sm text-gray-500'>{page + 1} / {totalPages}</span>
                  <button
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                    className='flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed'
                  >
                    Next <CaretRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'account' && (
          <div className='p-6 flex flex-col gap-6'>
            {/* Read-only info */}
            <div className='grid grid-cols-2 gap-x-10 gap-y-4 lg:grid-cols-4 pb-5 border-b border-gray-100'>
              {showClientName && <DetailField label='Name' value={account.name} />}
              <DetailField label='Account ID' value={id} />
              <DetailField label='Status' value={account.status} />
              <DetailField label='Creation Date' value={account.creationDate ? dayjs(account.creationDate).format('DD-MMM-YYYY') : null} />
              {account.partnerId ? (
                <div className='flex flex-col gap-0.5'>
                  <span className='text-xs text-gray-400 uppercase tracking-wide'>Partner Account</span>
                  <span
                    className='text-sm text-blue-600 hover:underline cursor-pointer'
                    onClick={() => navigate(`/management/partners/${account.partnerId}`)}
                  >
                    {account.partnerName || account.partnerId}
                  </span>
                </div>
              ) : (
                <DetailField label='Partner Account' value={null} />
              )}
              <DetailField label='Email' value={account.contactEmail} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
