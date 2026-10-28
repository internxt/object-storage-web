import { CSSProperties, useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, CaretLeft, CaretRight, ArrowSquareOut, Info, DownloadSimple } from '@phosphor-icons/react';
import dayjs from 'dayjs';
import { Partner, PartnerSubAccount, partnersService } from '../services/partners.service';
import { StatusBadge } from '../../components/StatusBadge';
import { ExportDateRangeModal } from '../../components/ExportDateRangeModal';
import { exportSubAccountsUsageReport, SUB_ACCOUNTS_EXPORT_MAX_DAYS } from '../../partners/services/subAccountsExport';
import { SubAccountsUsageReport } from '../../partners/services/partners.service';
import notificationsService from '../../services/notifications.service';
import { apiErrorMessage } from '../../utils/apiError';
import { StoragePoint, StorageOverTimeChart } from '../components/StorageOverTimeChart';
import { UsageDateRange } from '../components/UsageDateRange';
import { ActivityPoint, DailyActivityChart } from '../components/DailyActivityChart';
import { DeleteEntityButton, Emphasis } from '../components/DeleteEntityButton';
import { useManagement } from '../context/managementContext';
import { T, card, shadow, text } from '../../sub-account/tokens';

const PER_PAGE = 20;
const MAX_RANGE_DAYS = 31;

const ACCENT = '#6366f1';
const POSITIVE = '#10b981';

const labelStyle: CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.14em',
  color: T.gray60,
  margin: 0,
};

const metricStyle: CSSProperties = { fontSize: 48, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1 };

const unitStyle: CSSProperties = { fontSize: 20, fontWeight: 500, color: T.gray50 };

const columnStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 8, flex: 1, padding: '28px 40px' };

const buttonStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  height: 36,
  padding: '0 12px',
  fontSize: 14,
  fontWeight: 500,
  color: T.gray80,
  fontFamily: 'inherit',
  border: `1px solid ${T.gray20}`,
  borderRadius: 8,
  background: T.white,
  boxShadow: shadow.sm,
  cursor: 'pointer',
  flexShrink: 0,
};

const pageButtonStyle = (disabled: boolean): CSSProperties => ({
  ...buttonStyle,
  height: 32,
  fontSize: 13,
  boxShadow: 'none',
  opacity: disabled ? 0.4 : 1,
  cursor: disabled ? 'not-allowed' : 'pointer',
});

const headerCellStyle: CSSProperties = {
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

const tableStyle: CSSProperties = {
  width: '100%',
  fontSize: 14,
  textAlign: 'left',
  borderCollapse: 'separate',
  borderSpacing: 0,
};

const linkStyle: CSSProperties = { color: T.primary, textDecoration: 'underline', textUnderlineOffset: 2 };

const SUB_ACCOUNT_COLUMNS = [
  'ID',
  'Email',
  'Active Storage (TB)',
  'Deleted Storage (TB)',
  'Status',
  'Created',
  'Stripe',
];

const formatStorage = (bytes: number) => (bytes / 1e12).toFixed(4);
const formatDate = (s: string | null | undefined) => (s && dayjs(s).isValid() ? dayjs(s).format('DD MMM YYYY') : '—');

const GB_PER_TB = 1024;

type UsagePoint = StoragePoint & ActivityPoint;

const toUsageSeries = (report: SubAccountsUsageReport): UsagePoint[] => {
  const byDate = new Map<string, Omit<UsagePoint, 'date'>>();
  report.items.forEach(({ daily }) =>
    daily.forEach(({ date, activeStorageTb, deletedStorageTb, storageWroteTb, egressGb }) => {
      const day = byDate.get(date) ?? { active: 0, deleted: 0, uploaded: 0, downloaded: 0 };
      byDate.set(date, {
        active: day.active + activeStorageTb,
        deleted: day.deleted + deletedStorageTb,
        uploaded: day.uploaded + storageWroteTb * GB_PER_TB,
        downloaded: day.downloaded + egressGb,
      });
    }),
  );
  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, day]) => ({
      date: dayjs(date).format('DD MMM'),
      active: parseFloat(day.active.toFixed(2)),
      deleted: parseFloat(day.deleted.toFixed(2)),
      uploaded: parseFloat(day.uploaded.toFixed(2)),
      downloaded: parseFloat(day.downloaded.toFixed(2)),
    }));
};

const USAGE_VIEWS = { storage: 'Storage', activity: 'Daily activity' } as const;

type UsageView = keyof typeof USAGE_VIEWS;

const viewButtonStyle = (selected: boolean): CSSProperties => ({
  height: 30,
  padding: '0 12px',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 500,
  fontFamily: 'inherit',
  background: selected ? T.white : 'transparent',
  color: selected ? T.gray100 : T.gray60,
  boxShadow: selected ? shadow.sm : 'none',
});

export const PartnerDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { isSuperadmin } = useManagement();

  const [partner, setPartner] = useState<Partner | undefined>(undefined);
  const [partnerLoading, setPartnerLoading] = useState(true);
  const [partnerNotFound, setPartnerNotFound] = useState(false);

  const [subAccounts, setSubAccounts] = useState<PartnerSubAccount[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [range, setRange] = useState(() => ({
    from: dayjs().subtract(MAX_RANGE_DAYS, 'day').format('YYYY-MM-DD'),
    to: dayjs().format('YYYY-MM-DD'),
  }));
  const [usageSeries, setUsageSeries] = useState<UsagePoint[]>([]);
  const [usageView, setUsageView] = useState<UsageView>('storage');
  const [usageLoading, setUsageLoading] = useState(true);
  const [usageFailed, setUsageFailed] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    const statePartner: Partner | undefined = (location.state as { partner?: Partner })?.partner;
    if (statePartner && statePartner.id === id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPartner(statePartner);
      setPartnerLoading(false);
      return;
    }
    setPartnerLoading(true);
    setPartnerNotFound(false);
    partnersService
      .getPartnerById(id)
      .then(setPartner)
      .catch(() => setPartnerNotFound(true))
      .finally(() => setPartnerLoading(false));
  }, [id, location.state]);

  useEffect(() => {
    if (!id) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    partnersService
      .getPartnerSubAccounts(id, { page, perPage: PER_PAGE })
      .then((res) => {
        setSubAccounts(res.items);
        setTotal(res.total);
      })
      .finally(() => setLoading(false));
  }, [id, page]);

  useEffect(() => {
    if (!id) return;
    let stale = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUsageLoading(true);
    setUsageFailed(false);
    partnersService
      .getPartnerSubAccountsUsage(id, range)
      .then((report) => !stale && setUsageSeries(toUsageSeries(report)))
      .catch((e) => {
        if (stale) return;
        setUsageSeries([]);
        setUsageFailed(true);
        notificationsService.error({ text: apiErrorMessage(e, 'Failed to load usage') });
      })
      .finally(() => !stale && setUsageLoading(false));
    return () => {
      stale = true;
    };
  }, [id, range]);

  const handleDelete = async (partnerId: string) => {
    setIsDeleting(true);
    try {
      await partnersService.deletePartner(partnerId);
      notificationsService.success({ text: 'Partner deleted' });
      navigate('/management/partners');
    } catch (err) {
      notificationsService.error({ text: apiErrorMessage(err, 'Failed to delete partner') });
    } finally {
      setIsDeleting(false);
    }
  };

  if (partnerNotFound) {
    navigate('/management/partners');
    return null;
  }

  if (partnerLoading || !partner) {
    return <div style={{ ...text.hint, padding: 40, textAlign: 'center' }}>Loading…</div>;
  }

  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
        <button onClick={() => navigate('/management/partners')} style={buttonStyle}>
          <ArrowLeft size={14} />
          Back
        </button>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 style={{ ...text.heading, margin: 0 }}>
              {partner.name ?? <span className="font-mono">{partner.storageProviderId}</span>}
            </h1>
            <StatusBadge status={partner.status} />
          </div>
          {partner.email && <p style={{ fontSize: 13, color: T.gray50, margin: '2px 0 0' }}>{partner.email}</p>}
          <p className="font-mono" style={{ fontSize: 12, color: T.gray50, margin: '2px 0 0' }}>
            ID {partner.storageProviderId}
          </p>
        </div>
        <button
          onClick={() => setIsExportModalOpen(true)}
          disabled={total === 0}
          title="Export the same usage .xlsx this partner gets in their panel"
          style={{
            ...buttonStyle,
            marginLeft: 'auto',
            opacity: total === 0 ? 0.4 : 1,
            cursor: total === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          <DownloadSimple size={14} />
          Export usage
        </button>
        {isSuperadmin && partner.status !== 'DELETED' && (
          <div className="flex-shrink-0">
            <DeleteEntityButton
              title="Delete partner permanently?"
              description={
                <>
                  This will permanently delete{' '}
                  <Emphasis>{partner.name ?? partner.email ?? partner.storageProviderId}</Emphasis>. This also deletes
                  its{' '}
                  <Emphasis>
                    {partner.subAccountsCount} {partner.subAccountsCount === 1 ? 'sub-account' : 'sub-accounts'}
                  </Emphasis>{' '}
                  (<Emphasis>{partner.activeStorageTb.toFixed(4)} TB</Emphasis>) and their storage. This action cannot
                  be undone.
                </>
              }
              isDeleting={isDeleting}
              onConfirm={() => handleDelete(partner.id)}
            />
          </div>
        )}
      </div>

      <ExportDateRangeModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={(range) =>
          exportSubAccountsUsageReport(partnersService.getPartnerSubAccountsUsage(partner.id, range))
        }
        successText={(count) => `Exported usage for ${count} ${count === 1 ? 'sub-account' : 'sub-accounts'}`}
        title="Export partner sub-account usage"
        description={`Same export the partner gets in their panel (up to ${SUB_ACCOUNTS_EXPORT_MAX_DAYS} days). To match an invoice, use the same start and end dates shown on it.`}
        maxRangeDays={SUB_ACCOUNTS_EXPORT_MAX_DAYS}
      />

      {/* Stats */}
      <div style={{ ...card, borderRadius: 16, display: 'flex' }}>
        <div style={columnStyle}>
          <p style={labelStyle}>Active Storage</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ ...metricStyle, color: ACCENT }}>{partner.activeStorageTb.toFixed(4)}</span>
            <span style={unitStyle}>TB</span>
          </div>
        </div>
        <div style={{ ...columnStyle, borderLeft: `1px solid ${T.gray20}` }}>
          <p style={labelStyle}>Sub-accounts</p>
          <span style={{ ...metricStyle, color: POSITIVE }}>{loading ? '…' : total}</span>
        </div>
        <div style={{ ...columnStyle, borderLeft: `1px solid ${T.gray20}` }}>
          <p style={labelStyle}>Partner Created</p>
          <span style={{ ...metricStyle, fontSize: 32, color: T.gray80 }}>{formatDate(partner.providerCreatedAt)}</span>
        </div>
      </div>

      {/* Usage section */}
      <div style={{ ...card, overflow: 'hidden' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
            padding: '18px 24px',
            borderBottom: `1px solid ${T.gray15}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={text.heading}>Usage</span>
            <div role="tablist" style={{ display: 'flex', gap: 2, padding: 2, borderRadius: 8, background: T.gray10 }}>
              {(Object.keys(USAGE_VIEWS) as UsageView[]).map((view) => (
                <button
                  key={view}
                  role="tab"
                  aria-selected={usageView === view}
                  onClick={() => setUsageView(view)}
                  style={viewButtonStyle(usageView === view)}
                >
                  {USAGE_VIEWS[view]}
                </button>
              ))}
            </div>
          </div>
          <UsageDateRange from={range.from} to={range.to} maxDays={MAX_RANGE_DAYS} onChange={setRange} />
        </div>
        <div style={{ padding: 24 }}>
          {usageLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
              <div className="w-5 h-5 border-2 border-gray-20 border-t-primary rounded-full animate-spin" />
            </div>
          ) : usageFailed ? (
            <p role="alert" style={{ ...text.hint, color: T.red, textAlign: 'center', padding: '40px 0', margin: 0 }}>
              Couldn't load usage for this period. Try again or pick another date range.
            </p>
          ) : usageSeries.length === 0 ? (
            <p style={{ ...text.hint, textAlign: 'center', padding: '40px 0', margin: 0 }}>
              No usage data for this period
            </p>
          ) : usageView === 'storage' ? (
            <StorageOverTimeChart data={usageSeries} />
          ) : (
            <DailyActivityChart data={usageSeries} />
          )}
        </div>
      </div>

      {/* Sub-accounts section */}
      <div style={{ ...card, overflow: 'hidden' }}>
        <div style={{ padding: '18px 24px', borderBottom: `1px solid ${T.gray15}` }}>
          <span style={text.heading}>Sub-accounts</span>
        </div>

        <div style={{ overflowX: 'auto', position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 2,
              overflow: 'hidden',
              transition: 'opacity 300ms',
              opacity: loading ? 1 : 0,
            }}
          >
            <div style={{ height: '100%', background: T.primaryBg14, width: '100%' }}>
              <div className="animate-loading-bar" style={{ height: '100%', background: T.primary }} />
            </div>
          </div>

          <table style={tableStyle}>
            <thead>
              <tr>
                {SUB_ACCOUNT_COLUMNS.map((h) => (
                  <th key={h} style={headerCellStyle}>
                    {h === 'Stripe' ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        {h}
                        <span title="Sub-accounts belonging to a partner share the partner's own Stripe customer.">
                          <Info size={12} color={T.gray50} />
                        </span>
                      </span>
                    ) : (
                      h
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody style={{ transition: 'opacity 200ms', opacity: loading ? 0.4 : 1 }}>
              {subAccounts.length === 0 && !loading ? (
                <tr>
                  <td
                    colSpan={SUB_ACCOUNT_COLUMNS.length}
                    style={{ textAlign: 'center', padding: '64px 0', color: T.gray50, fontSize: 14, fontWeight: 500 }}
                  >
                    No sub-accounts linked to this partner
                  </td>
                </tr>
              ) : (
                subAccounts.map((sa, idx) => {
                  const cell: CSSProperties = {
                    padding: '14px 16px',
                    borderBottom: idx < subAccounts.length - 1 ? `1px solid ${T.gray15}` : 'none',
                  };
                  const numberCell: CSSProperties = {
                    ...cell,
                    fontSize: 13,
                    color: T.gray80,
                    fontVariantNumeric: 'tabular-nums',
                  };
                  return (
                    <tr
                      key={sa.id}
                      style={{ transition: 'background 120ms' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = T.gray5;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <td style={cell}>
                        <span
                          onClick={() => navigate(`/management/accounts/${sa.id}`)}
                          className="font-mono"
                          style={{ ...linkStyle, fontSize: 12, cursor: 'pointer' }}
                        >
                          {sa.id.slice(0, 8)}…{sa.id.slice(-4)}
                        </span>
                      </td>
                      <td style={{ ...cell, fontSize: 13, color: T.gray80 }}>{sa.email ?? '—'}</td>
                      <td style={numberCell}>{formatStorage(sa.activeStorageBytes)}</td>
                      <td style={numberCell}>{formatStorage(sa.deletedStorageBytes)}</td>
                      <td style={cell}>
                        <StatusBadge status={sa.status} />
                      </td>
                      <td style={{ ...cell, fontSize: 13, color: T.gray60, whiteSpace: 'nowrap' }}>
                        {formatDate(sa.createdAt)}
                      </td>
                      <td style={{ ...cell, fontSize: 13, whiteSpace: 'nowrap' }}>
                        {sa.customerId ? (
                          <a
                            href={`https://dashboard.stripe.com/customers/${sa.customerId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ ...linkStyle, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            View <ArrowSquareOut size={12} />
                          </a>
                        ) : (
                          <span style={{ color: T.gray50 }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 24px',
              borderTop: `1px solid ${T.gray15}`,
            }}
          >
            <span style={text.caption}>
              {page * PER_PAGE + 1}–{Math.min((page + 1) * PER_PAGE, total)} of {total}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button disabled={page === 0} onClick={() => setPage((p) => p - 1)} style={pageButtonStyle(page === 0)}>
                <CaretLeft size={14} /> Prev
              </button>
              <span style={{ ...text.hint, padding: '0 12px' }}>
                {page + 1} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                style={pageButtonStyle(page >= totalPages - 1)}
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
