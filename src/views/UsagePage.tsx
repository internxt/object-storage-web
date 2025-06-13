import { useEffect, useState } from 'react';
import { InfoCard, CapacityCard } from '../components/usage/InfoCard';
import { Usage, UsageSummary, usageService } from '../services/usage.service';
import { UsageTable } from '../components/usage/Table';
import { DateRangePicker } from '../components/DatePicker';
import dayjs from 'dayjs';
import { usePaginatedUsageData } from '../hooks/usePaginatedUserData';
import { CaretLeft, CaretRight, Export } from '@phosphor-icons/react';
import notificationsService from '../services/notifications.service';
import { ExportModal, ExportFormat } from '../components/usage/ExportModal';
import { exportUsageData } from '../utils/exportUtils';

const TABLE_HEADERS = [
  {
    title: 'Record Date',
    key: 'recordDate',
  },
  {
    title: 'Active Storage (TB)',
    key: 'activeStorage',
  },
  {
    title: 'Deleted Storage (TB)',
    key: 'deletedStorage',
  },
  {
    title: 'Active Objects',
    key: 'activeObjects',
  },
  {
    title: 'Deleted Objects',
    key: 'deletedObjects',
  },
  {
    title: 'API Calls',
    key: 'apiCalls',
  },
  {
    title: 'Egress (GB)',
    key: 'egress',
  },
  {
    title: 'Ingress (GB)',
    key: 'ingress',
  },
];

const DEFAULT_SUMMARY_DATA: UsageSummary = {
  totalCapacity: 0,
  usedCapacity: 0,
  remainingCapacity: 0,
  totalApiCalls: 0,
  totalEgress: 0,
  totalIngress: 0,
};

const PAGINATED_ITEMS = 20;

export type BODY_STATE = 'loading' | 'empty' | 'items';

export const UsagePage = () => {
  const [usageData, setUsageData] = useState<Usage[]>([]);
  const [summaryData, setSummaryData] =
    useState<UsageSummary>(DEFAULT_SUMMARY_DATA);
  const [tableBodyState, setTableBodyState] = useState<BODY_STATE>('loading');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [currentDateRange, setCurrentDateRange] = useState({
    startDate: dayjs().subtract(1, 'month').toDate().toISOString(),
    endDate: dayjs().toDate().toISOString(),
  });

  const {
    paginatedData,
    currentPage,
    setCurrentPage,
    pageInfo,
    totalItems,
    hasNextPage,
    hasPrevPage,
  } = usePaginatedUsageData(usageData, PAGINATED_ITEMS);

  useEffect(() => {
    const startDate = dayjs().subtract(1, 'month').toDate();
    const endDate = dayjs().toDate();

    getUsage(startDate.toDateString(), endDate.toDateString());
  }, []);

  const getUsage = async (startDate: string, endDate: string) => {
    try {
      setTableBodyState('loading');
      const { usage, summary } = await usageService.getUsage(
        startDate,
        endDate
      );

      if (usage.length === 0) {
        setSummaryData(DEFAULT_SUMMARY_DATA);
        setTableBodyState('empty');
      } else {
        setSummaryData(summary);
        setTableBodyState('items');
      }

      setUsageData(usage);
      setCurrentDateRange({ startDate, endDate });
    } catch (error) {
      const err = error as Error;
      notificationsService.error({
        text: err.message,
      });
      setTableBodyState('empty');
    }
  };

  const onApplyFilter = async (startDate: string, endDate: string) => {
    try {
      await getUsage(startDate, endDate);
    } catch (error) {
      const err = error as Error;
      notificationsService.error({
        text: err.message,
      });
    }
  };

  const handleExport = () => {
    setIsExportModalOpen(true);
  };

  const handleExportConfirm = async (format: ExportFormat) => {
    try {
      setIsExporting(true);

      if (usageData.length === 0) {
        notificationsService.error({
          text: 'No data available to export',
        });
        return;
      }

      exportUsageData(
        usageData,
        format,
        currentDateRange.startDate,
        currentDateRange.endDate
      );

      notificationsService.success({
        text: `Usage data exported successfully as ${format}`,
      });

      setIsExportModalOpen(false);
    } catch (error) {
      const err = error as Error;
      notificationsService.error({
        text: `Export failed: ${err.message}`,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportModalClose = () => {
    setIsExportModalOpen(false);
  };

  const formatWithBestUnit = (valueInGB: number): string => {
    const valueInMB = valueInGB * 1024;
    const valueInKB = valueInMB * 1024;

    if (valueInGB >= 1) {
      return `${valueInGB.toFixed(2)} GB`;
    } else if (valueInMB >= 1) {
      return `${valueInMB.toFixed(2)} MB`;
    } else if (valueInKB >= 1) {
      return `${valueInKB.toFixed(2)} KB`;
    } else {
      return `${(valueInKB * 1024).toFixed(2)} B`;
    }
  };

  const formatCapacityValue = (valueInGB: number): string => {
    const valueInTB = valueInGB / 1024;
    return `${valueInTB.toFixed(2)} TB`;
  };

  return (
    <section className='flex flex-col-reverse justify-between p-7 w-screen gap-10'>
      <div className='flex flex-col p-8 w-full bg-white gap-5'>
        <div className='flex flex-row justify-between items-center w-full'>
          <div className='flex w-full'>
            <h1 className='text-xl font-bold text-black'>Account Usage</h1>
          </div>
          <div className='flex flex-col w-full justify-end items-end gap-2'>
            <div className='flex items-center gap-4'>
              <DateRangePicker
                onApplyFilterButtonClicked={onApplyFilter}
                returnISOString={true}
              />
              <button
                onClick={handleExport}
                className='flex items-center gap-2 px-4 py-2 bg-gray-10 text-black rounded-md hover:bg-blue-700 transition-colors'
              >
                <Export size={16} />
                Export
              </button>
            </div>
          </div>
        </div>
        <div className='flex flex-col w-full justify-between h-full'>
          <UsageTable
            headers={TABLE_HEADERS}
            usage={paginatedData}
            bodyState={tableBodyState}
          />
          <div className='flex flex-row items-end justify-end w-full'>
            <div className='items-center flex flex-row gap-3'>
              <p className='text-sm text-gray-600'>
                {pageInfo.from}-{pageInfo.to} of {totalItems}
              </p>
              <div className='flex flex-row gap-3 items-center'>
                <button
                  disabled={!hasPrevPage}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  className='p-1 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  <CaretLeft
                    size={20}
                    className={`${
                      !hasPrevPage
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-black hover:text-blue-600'
                    }`}
                  />
                </button>
                <button
                  disabled={!hasNextPage}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className='p-1 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  <CaretRight
                    size={20}
                    className={`${
                      !hasNextPage
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-black hover:text-blue-600'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className='grid sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-10 gap-5 items-stretch'>
        <CapacityCard
          totalCapacity={formatCapacityValue(summaryData.totalCapacity * 1024)}
          usedCapacity={formatWithBestUnit(summaryData.usedCapacity)}
          remainingCapacity={formatWithBestUnit(summaryData.remainingCapacity)}
          className='col-span-4 h-full'
          tooltip='The total amount of storage provisioned for the account.'
        />
        <InfoCard
          value={summaryData.totalApiCalls.toLocaleString()}
          name='Total API Calls'
          className='col-span-2 h-full'
          tooltip='API Calls is the sum of all API Calls across all buckets for the date range. This also includes API Calls not made to a specific bucket.'
        />
        <InfoCard
          value={formatWithBestUnit(summaryData.totalEgress)}
          name='Total Egress'
          className='col-span-2 h-full'
          tooltip='Egress is the sum of all Egress across all buckets for the date range.'
        />
        <InfoCard
          value={formatWithBestUnit(summaryData.totalIngress)}
          name='Total Ingress'
          className='col-span-2 h-full'
          tooltip='Ingress is the sum of all Ingress across all buckets for the date range.'
        />
      </div>

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={handleExportModalClose}
        onExport={handleExportConfirm}
        isLoading={isExporting}
      />
    </section>
  );
};
