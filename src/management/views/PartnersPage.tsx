import { useEffect, useState } from 'react';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { partnersService, Partner, PartnersSummary } from '../services/partners.service';
import { PartnersTable, SortOrder } from '../components/PartnersTable';
import { CreatePartnerModal } from '../components/CreatePartnerModal';
import notificationsService from '../../services/notifications.service';

const PER_PAGE = 20;

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

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    fetchPartners();
  }, [page, sortOrder]);

  const fetchSummary = async () => {
    try {
      const data = await partnersService.getPartnersSummary();
      setSummary(data);
    } catch (err) {
      const e = err as Error;
      notificationsService.error({ text: e.message });
    }
  };

  const fetchPartners = async () => {
    setIsLoading(true);
    try {
      const res = await partnersService.getPartners({
        page,
        perPage: PER_PAGE,
        sortBy: sortOrder ? 'activeStorage' : undefined,
        sortOrder,
      });
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
    <div className='flex flex-col gap-5'>
      {/* Stats */}
      <div
        className='bg-white rounded-2xl overflow-hidden'
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' }}
      >
        <div className='px-10 pt-9 pb-3'>
          <p className='text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400'>
            Partners Overview
          </p>
        </div>
        <div className='px-10 pb-9 flex items-center gap-0'>
          {/* Total Partners */}
          <div className='flex flex-col gap-2 flex-1'>
            <p className='text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400'>
              Total Partners
            </p>
            <div className='flex items-baseline gap-2'>
              <span className='text-5xl font-semibold tracking-tight leading-none' style={{ color: '#6366f1' }}>
                {summary?.totalPartners ?? '—'}
              </span>
            </div>
          </div>

          <div className='w-px bg-gray-100 self-stretch mx-10' />

          {/* Total Active Storage */}
          <div className='flex flex-col gap-2 flex-1'>
            <p className='text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400'>
              Total Active Storage
            </p>
            <div className='flex items-baseline gap-2'>
              <span className='text-5xl font-semibold tracking-tight leading-none' style={{ color: '#6366f1' }}>
                {tbDisplay(summary?.activeStorageTb)}
              </span>
              <span className='text-xl font-medium text-gray-400'>TB</span>
            </div>
          </div>

          <div className='w-px bg-gray-100 self-stretch mx-10' />

          {/* Placeholder third stat */}
          <div className='flex flex-col gap-2 flex-1'>
            <p className='text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400'>
              MoM Growth
            </p>
            <div className='flex items-baseline gap-2'>
              <span className='text-5xl font-semibold tracking-tight leading-none text-gray-300'>-</span>
              <span className='text-xl font-medium text-gray-300'>%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className='bg-white rounded-xl shadow-sm p-6'>
        <div className='flex items-center justify-between mb-5'>
          <div>
            <h2 className='text-base font-semibold text-gray-900'>Partners</h2>
            {total > 0 && (
              <p className='text-xs text-gray-400 mt-0.5'>{total} partners total</p>
            )}
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className='bg-indigo hover:bg-indigo-dark active:bg-indigo-dark text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-sm'
          >
            Create Partner
          </button>
        </div>

        <PartnersTable
          partners={partners}
          isLoading={isLoading}
          sortOrder={sortOrder}
          onSortActiveStorage={(order) => { setPage(0); setSortOrder(order); }}
        />

        {/* Pagination */}
        <div className='flex items-center justify-between mt-4 pt-4 border-t border-gray-50'>
          <span className='text-xs text-gray-400'>
            Showing {fromItem}–{toItem} of {total} partners
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
