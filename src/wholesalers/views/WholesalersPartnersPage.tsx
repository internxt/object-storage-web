import { useEffect, useState } from 'react';
import { wholesalersService, WholesalerPartner } from '../services/wholesalers.service';
import { WholesalersPartnersTable } from '../components/WholesalersPartnersTable';
import { CreateWholesalerPartnerModal } from '../components/CreateWholesalerPartnerModal';
import { Pagination } from '../../components/ui/Pagination';
import notificationsService from '../../services/notifications.service';
import { T } from '../../sub-account/tokens';

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

  return (
    <div className='flex flex-col gap-5'>
      <div className='bg-white rounded-xl shadow-sm p-6'>
        <div className='flex items-center justify-between mb-5'>
          <div>
            <h2 className='text-base font-semibold text-gray-900'>Partners</h2>
            {total > 0 && <p className='text-xs text-gray-400 mt-0.5'>{total} partners total</p>}
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
            Create Partner
          </button>
        </div>

        <WholesalersPartnersTable partners={partners} isLoading={isLoading} />

        {total > PER_PAGE && (
          <div className='flex items-center justify-between mt-4 pt-4 border-t border-gray-50'>
            <span className='text-xs text-gray-400'>
              Showing {page * PER_PAGE + 1}–{Math.min((page + 1) * PER_PAGE, total)} of {total} partners
            </span>
            <Pagination currentPage={page + 1} totalItems={total} pageSize={PER_PAGE} onPageChange={(p) => setPage(p - 1)} />
          </div>
        )}
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
