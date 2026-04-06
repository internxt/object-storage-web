import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { ArrowLeft, Database, Package, CaretLeft, CaretRight } from '@phosphor-icons/react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { managementService, SubAccountDetail, SubAccountUsage } from '../services/management.service';
import notificationsService from '../../services/notifications.service';

const PER_PAGE = 20;

const StatusBadge = ({ status }: { status: SubAccountDetail['status'] }) => {
  const config = {
    PAID_ACCOUNT: { bg: '#22c55e', border: '#16a34a', color: '#fff', dot: 'rgba(255,255,255,0.6)', label: 'Paid Account' },
    SUSPENDED:    { bg: '#fef2f2', border: '#fecaca', color: '#b91c1c', dot: '#f87171',            label: 'Suspended' },
  }[status];

  return (
    <span
      className='inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border'
      style={{ background: config.bg, borderColor: config.border, color: config.color }}
    >
      <span className='w-1.5 h-1.5 rounded-full flex-shrink-0' style={{ background: config.dot }} />
      {config.label}
    </span>
  );
};

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

const fmt = (n: number, decimals = 8) => n.toFixed(decimals);
const fmtDate = (s: string) => dayjs(s).isValid() ? dayjs(s).format('DD-MMM-YYYY HH:mm') : s;
const fmtChartDate = (s: string) => dayjs(s).isValid() ? dayjs(s).format('DD MMM') : s;

export const SubAccountDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [account, setAccount] = useState<SubAccountDetail | null>(null);
  const [usages, setUsages] = useState<SubAccountUsage[]>([]);
  const [totalUsages, setTotalUsages] = useState(0);
  const [page, setPage] = useState(0);
  const [tab, setTab] = useState<'usage' | 'account'>('usage');
  const MAX_RANGE_DAYS = 15;
  const [from, setFrom] = useState(() => dayjs().subtract(MAX_RANGE_DAYS, 'day').format('YYYY-MM-DD'));
  const [to, setTo] = useState(() => dayjs().format('YYYY-MM-DD'));
  const [loading, setLoading] = useState(true);
  const [usagesLoading, setUsagesLoading] = useState(false);

  useEffect(() => {
    managementService
      .getSubAccountById(id!)
      .then((data) => {
        setAccount(data);
      })
      .catch((e) => notificationsService.error({ text: e.message }))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetchUsages();
  }, [id, from, to, page]);

  const fetchUsages = async () => {
    setUsagesLoading(true);
    try {
      const res = await managementService.getSubAccountUsages(id!, { from, to, page, perPage: PER_PAGE });
      setUsages(res.items.reverse());
      setTotalUsages(res.totalItems);
    } catch (e: any) {
      notificationsService.error({ text: e.message });
    } finally {
      setUsagesLoading(false);
    }
  };

  const totalPages = Math.ceil(totalUsages / PER_PAGE);
  const latestUsage = usages[0];

  const chartData = usages.map((u) => ({
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

  const tabClass = (t: typeof tab) =>
    `px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
      tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-800'
    }`;

  return (
    <div className='flex flex-col gap-5'>
      {/* Header */}
      <div className='flex items-start gap-4'>
        <button
          onClick={() => navigate('/management/accounts')}
          className='flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm hover:bg-gray-50 transition-colors flex-shrink-0'
        >
          <ArrowLeft size={14} />
          Back
        </button>
        <div>
          <div className='flex items-center gap-3'>
            <h1 className='text-lg font-bold text-gray-900 font-mono'>{account.name || String(account.id)}</h1>
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
                  ) : usages.reverse().map((u) => (
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
              <DetailField label='Account ID' value={id} />
              <DetailField label='Status' value={account.status} />
              <DetailField label='Creation Date' value={account.creationDate ? dayjs(account.creationDate).format('DD-MMM-YYYY') : null} />
              <DetailField label='Partner Account' value={account.channelAccountName} />
              <DetailField label='Email' value={account.contactEmail} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
