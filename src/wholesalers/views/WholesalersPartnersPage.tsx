import { useEffect, useState } from 'react';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { wholesalersService, WholesalerPartner } from '../services/wholesalers.service';
import { WholesalersPartnersTable } from '../components/WholesalersPartnersTable';
import { CreateWholesalerPartnerModal } from '../components/CreateWholesalerPartnerModal';
import notificationsService from '../../services/notifications.service';
import { T, card } from '../../sub-account/tokens';

const PER_PAGE = 20;

export const WholesalersPartnersPage = () => {
  const [partners, setPartners] = useState<WholesalerPartner[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchPartners();
  }, [page]);

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

  const totalPages = Math.ceil(total / PER_PAGE);
  const hasPrev = page > 0;
  const hasNext = page < totalPages - 1;
  const fromItem = total === 0 ? 0 : page * PER_PAGE + 1;
  const toItem = Math.min((page + 1) * PER_PAGE, total);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ ...card, borderRadius: 16, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: T.gray100, margin: 0 }}>Partners</h2>
            {total > 0 && (
              <p style={{ fontSize: 13, color: T.gray50, margin: '2px 0 0' }}>{total} partners total</p>
            )}
          </div>
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
        </div>

        <WholesalersPartnersTable partners={partners} isLoading={isLoading} />

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
        }}
      />
    </div>
  );
};
