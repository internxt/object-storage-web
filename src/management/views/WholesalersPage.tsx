import { useEffect, useState } from 'react';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { wholesalersService, Wholesaler } from '../services/wholesalers.service';
import { WholesalersTable } from '../components/WholesalersTable';
import { CreateWholesalerModal } from '../components/CreateWholesalerModal';
import notificationsService from '../../services/notifications.service';
import { T, card } from '../../sub-account/tokens';

const PER_PAGE = 20;

export const WholesalersPage = () => {
  const [wholesalers, setWholesalers] = useState<Wholesaler[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchWholesalers();
  }, [page]);

  const fetchWholesalers = async () => {
    setIsLoading(true);
    try {
      const res = await wholesalersService.getWholesalers({ page, perPage: PER_PAGE });
      setWholesalers(res.wholesalers);
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
            <h2 style={{ fontSize: 16, fontWeight: 600, color: T.gray100, margin: 0 }}>Wholesalers</h2>
            {total > 0 && (
              <p style={{ fontSize: 13, color: T.gray50, margin: '2px 0 0' }}>{total} wholesalers total</p>
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
            Create Wholesaler
          </button>
        </div>

        <WholesalersTable wholesalers={wholesalers} isLoading={isLoading} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 16, borderTop: `1px solid ${T.gray15}` }}>
          <span style={{ fontSize: 13, color: T.gray50 }}>
            Showing {fromItem}–{toItem} of {total} wholesalers
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

      <CreateWholesalerModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={async (dto) => {
          await wholesalersService.createWholesaler(dto);
          notificationsService.success({ text: 'Wholesaler created' });
          setPage(0);
          fetchWholesalers();
        }}
      />
    </div>
  );
};
