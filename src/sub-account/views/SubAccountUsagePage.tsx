import { useEffect, useState } from 'react';
import { Usage, usageService } from '../../services/usage.service';
import { UsageTable } from '../../components/usage/Table';
import dayjs from 'dayjs';
import { usePaginatedUsageData } from '../../hooks/usePaginatedUserData';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import notificationsService from '../../services/notifications.service';
import { BODY_STATE } from '../../views/UsagePage';

const TABLE_HEADERS = [
  { title: 'Record Date', key: 'recordDate' },
  { title: 'Active Storage (TB)', key: 'activeStorage' },
  { title: 'Active Objects', key: 'activeObjects' },
  { title: 'API Calls', key: 'apiCalls' },
  { title: 'Egress (GB)', key: 'egress' },
  { title: 'Ingress (GB)', key: 'ingress' },
];

const PAGINATED_ITEMS = 20;

export const SubAccountUsagePage = () => {
  const [usage, setUsage] = useState<Usage[]>([]);
  const [bodyState, setBodyState] = useState<BODY_STATE>('loading');
  const [fromDate, setFromDate] = useState(dayjs().subtract(30, 'days').format('YYYY-MM-DD'));
  const [toDate, setToDate] = useState(dayjs().format('YYYY-MM-DD'));

  const { paginatedData, currentPage, setCurrentPage, totalItems } = usePaginatedUsageData(usage, PAGINATED_ITEMS);

  useEffect(() => {
    if (fromDate && toDate) fetchUsage(new Date(fromDate), new Date(toDate));
  }, [fromDate, toDate]);

  const fetchUsage = async (from: Date, to: Date) => {
    setBodyState('loading');
    try {
      const { usage: data } = await usageService.getUsage(
        dayjs(from).format('YYYY-MM-DD'),
        dayjs(to).format('YYYY-MM-DD'),
      );
      setUsage(data);
      setBodyState(data.length === 0 ? 'empty' : 'items');
    } catch (err) {
      notificationsService.error({ text: (err as Error).message });
      setBodyState('empty');
    }
  };

  return (
    <section className='flex flex-col items-center p-7 w-full'>
      <div className='flex flex-col p-8 w-full bg-white gap-5 rounded-md'>
        <div className='flex flex-row w-full justify-between items-center'>
          <p className='font-semibold text-lg'>Usage</p>
          <div className='flex items-center gap-2 text-sm text-gray-600'>
            <input type='date' value={fromDate} onChange={(e) => setFromDate(e.target.value)} className='border border-gray-300 rounded px-2 py-1 text-sm' />
            <span>—</span>
            <input type='date' value={toDate} onChange={(e) => setToDate(e.target.value)} className='border border-gray-300 rounded px-2 py-1 text-sm' />
          </div>
        </div>

        <UsageTable headers={TABLE_HEADERS} bodyState={bodyState} usage={paginatedData} />

        <div className='flex flex-row items-center justify-end gap-2'>
          <button
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className='p-1 disabled:opacity-30'
          >
            <CaretLeft size={16} />
          </button>
          <span className='text-sm text-gray-500'>
            {totalItems === 0 ? 'No data' : `${currentPage * PAGINATED_ITEMS + 1}–${Math.min((currentPage + 1) * PAGINATED_ITEMS, totalItems)} of ${totalItems}`}
          </span>
          <button
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={(currentPage + 1) * PAGINATED_ITEMS >= totalItems}
            className='p-1 disabled:opacity-30'
          >
            <CaretRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
};
