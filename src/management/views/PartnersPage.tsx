import { useCallback, useEffect, useRef, useState } from 'react';
import { CaretLeft, CaretRight, MagnifyingGlassIcon } from '@phosphor-icons/react';
import { partnersService, Partner, PartnersSummary } from '../services/partners.service';
import { PartnersTable, SortOrder } from '../components/PartnersTable';
import { CreatePartnerModal } from '../components/CreatePartnerModal';
import notificationsService from '../../services/notifications.service';
import { T, card } from '../../sub-account/tokens';
import { apiErrorMessage } from '../../utils/apiError';

const PER_PAGE = 20;
const ACCENT = '#6366f1';

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.14em',
  color: T.gray60,
};

const metricStyle: React.CSSProperties = {
  fontSize: 48,
  fontWeight: 600,
  letterSpacing: '-0.02em',
  lineHeight: 1,
};

const unitStyle: React.CSSProperties = { fontSize: 20, fontWeight: 500, color: T.gray50 };

const statColumnStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  flex: 1,
  padding: '28px 40px',
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

function tbDisplay(value?: number | null): string {
  if (value == null) return '—';
  return value.toFixed(2);
}

export const PartnersPage = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<PartnersSummary | null>(null);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder | undefined>('desc');
  const [showDeleted, setShowDeleted] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const latestRequestId = useRef(0);

  const fetchSummary = async () => {
    try {
      const data = await partnersService.getPartnersSummary();
      setSummary(data);
    } catch (err) {
      notificationsService.error({ text: apiErrorMessage(err, 'Failed to load partners summary') });
    }
  };

  const fetchPartners = useCallback(async () => {
    const requestId = ++latestRequestId.current;
    setIsLoading(true);
    try {
      const res = await partnersService.getPartners({
        page,
        perPage: PER_PAGE,
        sortBy: sortOrder ? 'activeStorage' : undefined,
        sortOrder,
        includeDeleted: showDeleted,
        search: debouncedSearch || undefined,
      });
      if (requestId !== latestRequestId.current) return;
      setPartners(res.partners);
      setTotal(res.total);
    } catch (err) {
      if (requestId !== latestRequestId.current) return;
      notificationsService.error({ text: apiErrorMessage(err, 'Failed to load partners') });
    } finally {
      if (requestId === latestRequestId.current) setIsLoading(false);
    }
  }, [page, sortOrder, showDeleted, debouncedSearch]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSummary();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0);
      setDebouncedSearch(search.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPartners();
  }, [fetchPartners]);

  const totalPages = Math.ceil(total / PER_PAGE);
  const hasPrev = page > 0;
  const hasNext = page < totalPages - 1;
  const fromItem = total === 0 ? 0 : page * PER_PAGE + 1;
  const toItem = Math.min((page + 1) * PER_PAGE, total);

  return (
    <div className="flex flex-col gap-5">
      <div style={{ ...card, borderRadius: 16, display: 'flex' }}>
        <div style={statColumnStyle}>
          <p style={labelStyle}>Total Partners</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ ...metricStyle, color: ACCENT }}>{summary?.totalPartners ?? '—'}</span>
          </div>
        </div>

        <div style={{ ...statColumnStyle, borderLeft: `1px solid ${T.gray20}` }}>
          <p style={labelStyle}>Total Active Storage</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ ...metricStyle, color: ACCENT }}>{tbDisplay(summary?.activeStorageTb)}</span>
            <span style={unitStyle}>TB</span>
          </div>
        </div>

        <div style={{ ...statColumnStyle, borderLeft: `1px solid ${T.gray20}` }}>
          <p style={labelStyle}>MoM Growth</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ ...metricStyle, color: T.gray20 }}>—</span>
          </div>
        </div>
      </div>

      <div style={{ ...card, borderRadius: 16, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: T.gray100, margin: 0 }}>Partners</h2>
            {total > 0 && <p style={{ fontSize: 13, color: T.gray50, margin: '2px 0 0' }}>{total} partners total</p>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={showDeleted}
                onChange={(e) => {
                  setPage(0);
                  setShowDeleted(e.target.checked);
                }}
                style={{ width: 16, height: 16, accentColor: T.primary, cursor: 'pointer' }}
              />
              <span style={{ fontSize: 14, color: T.gray60 }}>Show deleted</span>
            </label>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                height: 40,
                padding: '0 18px',
                background: T.primary,
                color: T.white,
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
                whiteSpace: 'nowrap',
              }}
            >
              Create Partner
            </button>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            border: `1px solid ${T.gray20}`,
            borderRadius: 8,
            padding: '0 12px',
            maxWidth: 384,
            marginBottom: 16,
            background: T.white,
          }}
        >
          <MagnifyingGlassIcon size={15} color={T.gray50} style={{ flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              fontSize: 14,
              padding: '8px 0',
              outline: 'none',
              flex: 1,
              background: 'transparent',
              color: T.gray80,
              border: 'none',
            }}
          />
        </div>

        <PartnersTable
          partners={partners}
          isLoading={isLoading}
          sortOrder={sortOrder}
          onSortActiveStorage={(order) => {
            setPage(0);
            setSortOrder(order);
          }}
        />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 16,
            paddingTop: 16,
            borderTop: `1px solid ${T.gray15}`,
          }}
        >
          <span style={{ fontSize: 13, color: T.gray50 }}>
            Showing {fromItem}–{toItem} of {total} partners
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              disabled={!hasPrev}
              onClick={() => setPage((p) => p - 1)}
              style={{ ...pageButtonStyle, cursor: hasPrev ? 'pointer' : 'not-allowed', opacity: hasPrev ? 1 : 0.4 }}
            >
              <CaretLeft size={14} />
              Prev
            </button>
            <span style={{ padding: '0 8px', fontSize: 13, color: T.gray50 }}>
              {page + 1} / {Math.max(1, totalPages)}
            </span>
            <button
              disabled={!hasNext}
              onClick={() => setPage((p) => p + 1)}
              style={{ ...pageButtonStyle, cursor: hasNext ? 'pointer' : 'not-allowed', opacity: hasNext ? 1 : 0.4 }}
            >
              Next
              <CaretRight size={14} />
            </button>
          </div>
        </div>
      </div>
      <CreatePartnerModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={async (dto) => {
          await partnersService.createPartner(dto);
          notificationsService.success({ text: 'Partner created' });
          setPage(0);
          fetchPartners();
          fetchSummary();
        }}
      />
    </div>
  );
};
