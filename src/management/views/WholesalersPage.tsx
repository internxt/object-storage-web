import { useEffect, useState } from 'react';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { wholesalersService, Wholesaler } from '../services/wholesalers.service';
import { WholesalersTable } from '../components/WholesalersTable';
import { CreateWholesalerModal } from '../components/CreateWholesalerModal';
import notificationsService from '../../services/notifications.service';
import { T } from '../../sub-account/tokens';

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
    <div className='flex flex-col gap-5'>
      <div className='bg-white rounded-xl shadow-sm p-6'>
        <div className='flex items-center justify-between mb-5'>
          <div>
            <h2 className='text-base font-semibold text-gray-900'>Wholesalers</h2>
            {total > 0 && <p className='text-xs text-gray-400 mt-0.5'>{total} wholesalers total</p>}
          </div>
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
            Create Wholesaler
          </button>
        </div>

        <WholesalersTable wholesalers={wholesalers} isLoading={isLoading} />

        <div className='flex items-center justify-between mt-4 pt-4 border-t border-gray-50'>
          <span className='text-xs text-gray-400'>
            Showing {fromItem}–{toItem} of {total} wholesalers
          </span>
          <div className='flex items-center gap-1'>
            <button
              disabled={!hasPrev}
              onClick={() => setPage((p) => p - 1)}
              className='flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors'
            >
              <CaretLeft size={14} />
              Prev
            </button>
            <span className='px-3 py-1.5 text-sm text-gray-500'>
              {page + 1} / {Math.max(1, totalPages)}
            </span>
            <button
              disabled={!hasNext}
              onClick={() => setPage((p) => p + 1)}
              className='flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors'
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
