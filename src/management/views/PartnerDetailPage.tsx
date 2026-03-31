import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Database, Users, CaretLeft, CaretRight } from '@phosphor-icons/react';
import dayjs from 'dayjs';
import { Partner, PartnerSubAccount, partnersService } from '../services/partners.service';

const PER_PAGE = 20;

const PartnerStatusBadge = ({ status }: { status: Partner['status'] }) => {
  const config = {
    ACTIVE:  { bg: '#f0fdf4', border: '#bbf7d0', color: '#15803d', dot: '#22c55e', label: 'Active' },
    DELETED: { bg: '#fef2f2', border: '#fecaca', color: '#b91c1c', dot: '#f87171', label: 'Deleted' },
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

const SubAccountStatusBadge = ({ status }: { status: PartnerSubAccount['status'] }) => {
  const config: Record<string, { bg: string; border: string; color: string; dot: string; label: string }> = {
    ACTIVE:    { bg: '#f0fdf4', border: '#bbf7d0', color: '#15803d', dot: '#22c55e', label: 'Active' },
    SUSPENDED: { bg: '#fef2f2', border: '#fecaca', color: '#b91c1c', dot: '#f87171', label: 'Suspended' },
    DELETED:   { bg: '#f9fafb', border: '#e5e7eb', color: '#6b7280', dot: '#9ca3af', label: 'Deleted' },
  };
  const c = config[status] ?? config['DELETED'];

  return (
    <span
      className='inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border tracking-wide'
      style={{ background: c.bg, borderColor: c.border, color: c.color }}
    >
      <span className='w-1.5 h-1.5 rounded-full flex-shrink-0' style={{ background: c.dot }} />
      {c.label}
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

const formatStorage = (bytes: number) => (bytes / 1e12).toFixed(4);
const formatDate = (s: string | null | undefined) =>
  s && dayjs(s).isValid() ? dayjs(s).format('DD MMM YYYY') : '—';

export const PartnerDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const partner: Partner | undefined = (location.state as any)?.partner;

  const [subAccounts, setSubAccounts] = useState<PartnerSubAccount[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    partnersService
      .getPartnerSubAccounts(id, { page, perPage: PER_PAGE })
      .then((res) => {
        setSubAccounts(res.items);
        setTotal(res.total);
      })
      .finally(() => setLoading(false));
  }, [id, page]);

  if (!partner) {
    navigate('/management/partners');
    return null;
  }

  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <div className='flex flex-col gap-5'>
      {/* Header */}
      <div className='flex items-start gap-4'>
        <button
          onClick={() => navigate('/management/partners')}
          className='flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm hover:bg-gray-50 transition-colors flex-shrink-0'
        >
          <ArrowLeft size={14} />
          Back
        </button>
        <div>
          <div className='flex items-center gap-3'>
            <h1 className='text-lg font-bold text-gray-900'>
              {partner.name ?? <span className='font-mono'>{partner.storageProviderId}</span>}
            </h1>
            <PartnerStatusBadge status={partner.status} />
          </div>
          {partner.email && (
            <p className='text-sm text-gray-400 mt-0.5'>{partner.email}</p>
          )}
          <p className='text-xs text-gray-300 mt-0.5 font-mono'>ID {partner.storageProviderId}</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
        <StatCard
          icon={<Database size={20} weight='duotone' className='text-indigo-600' />}
          value={`${partner.activeStorageTb.toFixed(4)} TB`}
          label='Active Storage'
        />
        <StatCard
          icon={<Users size={20} weight='duotone' className='text-indigo-600' />}
          value={loading ? '…' : String(total)}
          label='Sub-accounts'
        />
        <StatCard
          icon={<Database size={20} weight='duotone' className='text-indigo-600' />}
          value={formatDate(partner.providerCreatedAt)}
          label='Provider Created'
        />
      </div>

      {/* Sub-accounts section */}
      <div className='bg-white rounded-xl shadow-sm overflow-hidden'>
        <div className='px-5 py-4 border-b border-gray-100'>
          <h2 className='text-sm font-semibold text-gray-700'>Sub-accounts</h2>
        </div>

        <div className='overflow-x-auto relative'>
          {/* Loading bar */}
          <div className={`absolute top-0 left-0 right-0 h-[2px] overflow-hidden transition-opacity duration-300 ${loading ? 'opacity-100' : 'opacity-0'}`}>
            <div className='h-full bg-indigo-400/30 w-full'>
              <div className='h-full bg-indigo-400 animate-loading-bar' />
            </div>
          </div>

          <table className='w-full text-sm text-left border-separate border-spacing-0'>
            <thead>
              <tr>
                {['ID', 'Email', 'Active Storage (TB)', 'Deleted Storage (TB)', 'Status', 'Created'].map((h) => (
                  <th
                    key={h}
                    className='px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-400 border-b border-gray-100 bg-white whitespace-nowrap'
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={`transition-opacity duration-200 ${loading ? 'opacity-40' : 'opacity-100'}`}>
              {subAccounts.length === 0 && !loading ? (
                <tr>
                  <td colSpan={6} className='text-center py-16 text-gray-300 text-sm font-medium'>
                    No sub-accounts linked to this partner
                  </td>
                </tr>
              ) : (
                subAccounts.map((sa, idx) => (
                  <tr key={sa.id} className='hover:bg-gray-50/80 transition-colors'>
                    <td
                      className={`px-4 py-3.5 ${idx < subAccounts.length - 1 ? 'border-b border-gray-50' : ''}`}
                      onClick={() => navigate(`/management/accounts/${sa.id}`)}
                    >
                      <span className='font-mono text-[11px] text-[#1e3a5f] hover:text-[#122840] underline underline-offset-2 cursor-pointer tracking-tight'>
                        {sa.id.slice(0, 8)}…{sa.id.slice(-4)}
                      </span>
                    </td>
                    <td className={`px-4 py-3.5 text-[13px] text-gray-600 ${idx < subAccounts.length - 1 ? 'border-b border-gray-50' : ''}`}>
                      {sa.email ?? '—'}
                    </td>
                    <td className={`px-4 py-3.5 font-mono text-[12px] text-gray-700 tabular-nums ${idx < subAccounts.length - 1 ? 'border-b border-gray-50' : ''}`}>
                      {formatStorage(sa.activeStorageBytes)}
                    </td>
                    <td className={`px-4 py-3.5 font-mono text-[12px] text-gray-700 tabular-nums ${idx < subAccounts.length - 1 ? 'border-b border-gray-50' : ''}`}>
                      {formatStorage(sa.deletedStorageBytes)}
                    </td>
                    <td className={`px-4 py-3.5 ${idx < subAccounts.length - 1 ? 'border-b border-gray-50' : ''}`}>
                      <SubAccountStatusBadge status={sa.status} />
                    </td>
                    <td className={`px-4 py-3.5 text-[12px] text-gray-500 whitespace-nowrap ${idx < subAccounts.length - 1 ? 'border-b border-gray-50' : ''}`}>
                      {formatDate(sa.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className='flex items-center justify-between px-5 py-3 border-t border-gray-50'>
            <span className='text-xs text-gray-400'>
              {page * PER_PAGE + 1}–{Math.min((page + 1) * PER_PAGE, total)} of {total}
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
    </div>
  );
};
