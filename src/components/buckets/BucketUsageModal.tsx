import { useEffect, useState } from 'react';
import {
  bucketsService,
  BucketUsageItem,
} from '../../services/buckets.service';
import { DateRangePicker } from '../DatePicker';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Dropdown } from '../Dropdown';
import { CaretDown, X } from '@phosphor-icons/react';
import {
  MetricType,
  METRIC_OPTIONS,
  formatMetricValue,
  formatChartDate,
  aggregateUsageByDate,
  ChartDataPoint,
} from '../../utils/bucketUsageTransforms';
import Modal from '../Modal';
import { Skeleton } from '../ui/skeleton';

interface BucketUsageModalProps {
  isOpen: boolean;
  onClose: () => void;
  bucketNumber: number;
  bucketName: string;
  bucketRegion: string;
}

export const BucketUsageModal = ({
  isOpen,
  onClose,
  bucketNumber,
  bucketName,
  bucketRegion,
}: BucketUsageModalProps) => {
  const [usageData, setUsageData] = useState<BucketUsageItem[]>([]);
  const [selectedMetric, setSelectedMetric] =
    useState<MetricType>('activeStorage');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchBucketUsageData();
    }
  }, [isOpen, bucketNumber]);

  const fetchBucketUsageData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const data = await bucketsService.getAllBucketUsage(
        startDate,
        endDate,
        bucketNumber
      );
      setUsageData(data);
    } catch (err) {
      const error = err as Error;
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const onApplyFilter = async (startDate: string, endDate: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await bucketsService.getAllBucketUsage(
        new Date(startDate),
        new Date(endDate),
        bucketNumber
      );
      setUsageData(data);
    } catch (err) {
      const error = err as Error;
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const chartData: ChartDataPoint[] =
    usageData.length > 0 ? aggregateUsageByDate(usageData, selectedMetric) : [];

  const selectedMetricOption = METRIC_OPTIONS.find(
    (option) => option.value === selectedMetric
  )!;

  const config = {
    value: {
      label: selectedMetricOption.label,
      color: selectedMetricOption.color,
      formatter: (value: number) => formatMetricValue(value, selectedMetric),
    },
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth='max-w-7xl'
      width='w-[95vw]'
    >
      <div className='flex flex-col gap-5 w-full'>
        <div className='flex flex-row justify-between items-center w-full'>
          <div className='flex flex-col'>
            <h1 className='text-xl font-bold text-black'>{bucketName} Usage</h1>
            <p className='text-sm text-gray-600'>Region: {bucketRegion}</p>
          </div>
          <button
            onClick={onClose}
            className='group p-2 hover:bg-gray-100 rounded-full'
          >
            <X className='text-black group-hover:text-white' size={20} />
          </button>
        </div>

        <div className='flex flex-row justify-between items-center w-full'>
          <div className='flex flex-row gap-4 items-end'>
            <div className='flex flex-col gap-1'>
              <label className='text-sm text-gray-600'>Metric</label>
              <Dropdown
                width='w-64'
                button={
                  <div className='flex w-full border border-black/10 flex-row justify-between py-2 px-4 rounded-md items-center'>
                    <div className='flex flex-row gap-2 items-center'>
                      <div
                        className='w-3 h-3 rounded-full'
                        style={{ backgroundColor: selectedMetricOption.color }}
                      />
                      <p className='text-black'>{selectedMetricOption.label}</p>
                    </div>
                    <CaretDown size={14} className='text-black' />
                  </div>
                }
                items={METRIC_OPTIONS.map((option) => ({
                  label: option.label,
                  onClick: () => setSelectedMetric(option.value),
                  render: () => (
                    <div className='flex flex-row items-center gap-3 px-4 py-2'>
                      <div
                        className='w-3 h-3 rounded-full'
                        style={{ backgroundColor: option.color }}
                      />
                      <span>{option.label}</span>
                    </div>
                  ),
                }))}
              />
            </div>
          </div>

          <div className='flex flex-col w-full justify-end items-end gap-2'>
            <DateRangePicker
              onApplyFilterButtonClicked={onApplyFilter}
              returnISOString={true}
            />
          </div>
        </div>

        {error && (
          <div className='flex items-center justify-center p-4 bg-red-50 border border-red-200 rounded-md'>
            <p className='text-red-700'>{error}</p>
          </div>
        )}

        {isLoading && (
          <div className='flex flex-col w-full justify-between h-full'>
            <Skeleton className='h-[500px] w-full rounded-md !bg-gray-100' />
          </div>
        )}

        {!isLoading && !error && chartData.length > 0 && (
          <div className='flex flex-col w-full justify-between h-full'>
            <ChartContainer config={config} className='h-[500px] w-full'>
              <AreaChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray='3 3' className='stroke-muted' />
                <XAxis
                  dataKey='timestamp'
                  tickFormatter={formatChartDate}
                  className='text-xs fill-muted-foreground'
                  type='number'
                  domain={['dataMin', 'dataMax']}
                  scale='time'
                  interval='preserveStartEnd'
                />
                <YAxis
                  tickFormatter={(value: number) =>
                    formatMetricValue(value, selectedMetric)
                  }
                  className='text-xs fill-muted-foreground'
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(timestamp) =>
                        new Date(Number(timestamp)).toLocaleDateString('sv-SE')
                      }
                    />
                  }
                />
                <Area
                  type='monotone'
                  dataKey='value'
                  stroke={selectedMetricOption.color}
                  fill={selectedMetricOption.color}
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </div>
        )}

        {!isLoading && !error && chartData.length === 0 && (
          <div className='flex items-center justify-center p-8 bg-gray-50 rounded-md'>
            <p className='text-gray-600'>
              No usage data available for this bucket in the selected date
              range.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};
