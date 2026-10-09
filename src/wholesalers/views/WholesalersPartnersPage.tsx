import { useEffect, useState } from 'react';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { wholesalersService, WholesalerPartner, WholesalerUsageSummary } from '../services/wholesalers.service';
import { WholesalersPartnersTable } from '../components/WholesalersPartnersTable';
import { CreateWholesalerPartnerModal } from '../components/CreateWholesalerPartnerModal';
import { useWholesalers } from '../context/wholesalersContext';
import notificationsService from '../../services/notifications.service';
import { apiErrorMessage } from '../../utils/apiError';
import { T, card } from '../../sub-account/tokens';

const PER_PAGE = 20;
const ACCENT = '#6366f1';
const POSITIVE = '#10b981';

const labelStyle = {
  fontSize: 10,
  fontWeight: 600,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.14em',
  color: T.gray60,
};

const metricStyle = {
  fontSize: 48,
  fontWeight: 600,
  letterSpacing: '-0.02em',
  lineHeight: 1,
};

const unitStyle = { fontSize: 20, fontWeight: 500, color: T.gray50 };

export const WholesalersPartnersPage = () => {
  const { isViewer } = useWholesalers();
  const [usageSummary, setUsageSummary] = useState<WholesalerUsageSummary | null>(null);
  const [partners, setPartners] = useState<WholesalerPartner[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deletingPartnerId, setDeletingPartnerId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsageSummary();
  }, []);

  useEffect(() => {
    fetchPartners();
  }, [page]);

  const fetchUsageSummary = async () => {
    try {
      const data = await wholesalersService.getUsageSummary();
      setUsageSummary(data);
    } catch (err) {
      notificationsService.error({ text: apiErrorMessage(err, 'Failed to load usage summary') });
    }
  };

  const fetchPartners = async () => {
    setIsLoading(true);
    try {
      const res = await wholesalersService.getPartners({ page, perPage: PER_PAGE });
      setPartners(res.partners);
      setTotal(res.total);
    } catch (err) {
      const e = err as Error;
      notificationsService.error({ text: e.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingPartnerId(id);
    try {
      await wholesalersService.deletePartner(id);
      notificationsService.success({ text: 'Partner deleted' });
      fetchPartners();
      fetchUsageSummary();
    } catch (err) {
      notificationsService.error({ text: apiErrorMessage(err, 'Failed to delete partner') });
    } finally {
      setDeletingPartnerId(null);
    }
  };

  const handleRename = async (id: string, name: string) => {
    await wholesalersService.updatePartnerName(id, name);
    setPartners((current) => current.map((p) => (p.id === id ? { ...p, name } : p)));
  };

  const totalPages = Math.ceil(total / PER_PAGE);
  const hasPrev = page > 0;
  const hasNext = page < totalPages - 1;
  const fromItem = total === 0 ? 0 : page * PER_PAGE + 1;
  const toItem = Math.min((page + 1) * PER_PAGE, total);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {usageSummary && (
        <div style={{ ...card, borderRadius: 16, display: 'flex' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, padding: '28px 40px' }}>
            <p style={labelStyle}>Active Storage</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ ...metricStyle, color: ACCENT }}>{usageSummary.activeStorageTb.toFixed(2)}</span>
              <span style={unitStyle}>TB</span>
            </div>
          </div>
          <div
            style={{
              display: 'flex', flexDirection: 'column', gap: 8, flex: 1,
              padding: '28px 40px', borderLeft: `1px solid ${T.gray20}`,
            }}
          >
            <p style={labelStyle}>Partners</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ ...metricStyle, color: POSITIVE }}>{usageSummary.totalPartners}</span>
            </div>
          </div>
        </div>
      )}

      <div style={{ ...card, borderRadius: 16, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: T.gray100, margin: 0 }}>Partners</h2>
            {total > 0 && (
              <p style={{ fontSize: 13, color: T.gray50, margin: '2px 0 0' }}>{total} partners total</p>
            )}
          </div>
          {!isViewer && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                height: 40, padding: '0 18px',
                background: T.primary, color: T.white,
                border: 'none', borderRadius: 8, cursor: 'pointer',
                fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap',
              }}
            >
              Create Partner
            </button>
          )}
        </div>

        <WholesalersPartnersTable
          partners={partners}
          isLoading={isLoading}
          onDelete={handleDelete}
          onRename={handleRename}
          deletingPartnerId={deletingPartnerId}
        />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 16, borderTop: `1px solid ${T.gray15}` }}>
          <span style={{ fontSize: 13, color: T.gray50 }}>
            Showing {fromItem}–{toItem} of {total} partners
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              disabled={!hasPrev}
              onClick={() => setPage((p) => p - 1)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                height: 32, padding: '0 12px',
                fontSize: 13, fontWeight: 500, color: T.gray80,
                border: `1px solid ${T.gray20}`, borderRadius: 8,
                background: T.white, cursor: hasPrev ? 'pointer' : 'not-allowed',
                opacity: hasPrev ? 1 : 0.4,
              }}
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
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                height: 32, padding: '0 12px',
                fontSize: 13, fontWeight: 500, color: T.gray80,
                border: `1px solid ${T.gray20}`, borderRadius: 8,
                background: T.white, cursor: hasNext ? 'pointer' : 'not-allowed',
                opacity: hasNext ? 1 : 0.4,
              }}
            >
              Next
              <CaretRight size={14} />
            </button>
          </div>
        </div>
      </div>

      <CreateWholesalerPartnerModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={async (dto) => {
          await wholesalersService.createPartner(dto);
          notificationsService.success({ text: 'Partner created' });
          setPage(0);
          fetchPartners();
          fetchUsageSummary();
        }}
      />
    </div>
  );
};
