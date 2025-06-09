import { useEffect, useState } from 'react';
import { bucketsService, BucketUsageItem } from '../services/buckets.service';
import { DateRangePicker } from '../components/DatePicker';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '../components/ui/chart';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Dropdown } from '../components/Dropdown';
import { CaretDown } from '@phosphor-icons/react';
import {
  MetricType,
  METRIC_OPTIONS,
  formatMetricValue,
  formatChartDate,
  aggregateUsageByDate,
  ChartDataPoint,
} from '../utils/bucketUsageTransforms';

const TestBucketUsage = () => {
  const [usageData, setUsageData] = useState<BucketUsageItem[]>([]);
  const [selectedMetric, setSelectedMetric] =
    useState<MetricType>('activeStorage');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        const data = await bucketsService.getAllBucketUsage(startDate, endDate);
        setUsageData(data);
      } catch (err) {
        setError('Failed to fetch usage data');
        console.error('Error fetching usage data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  const onApplyFilter = async (startDate: string, endDate: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await bucketsService.getAllBucketUsage(
        new Date(startDate),
        new Date(endDate)
      );
      setUsageData(data);
    } catch (err) {
      setError('Failed to fetch filtered usage data');
      console.error('Error fetching filtered data:', err);
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
    },
  };

  return (
    <section className='flex flex-row justify-between p-7 w-screen gap-10'>
      <div className='flex flex-col p-8 w-full bg-white gap-5'>
        <div className='flex flex-row justify-between items-center w-full'>
          <div className='flex w-full'>
            <h1 className='text-xl font-bold text-black'>Account Usage</h1>
          </div>
          <div className='flex flex-col w-full justify-end items-end gap-2'>
            <DateRangePicker
              onApplyFilterButtonClicked={onApplyFilter}
              returnISOString={true}
            />
          </div>
        </div>

        <div className='flex flex-row justify-between items-center w-full'>
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

        {error && (
          <div className='flex items-center justify-center p-4 bg-red-50 border border-red-200 rounded-md'>
            <p className='text-red-700'>{error}</p>
          </div>
        )}

        {isLoading && (
          <div className='flex items-center justify-center p-8'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900'></div>
            <p className='ml-3 text-gray-600'>Loading usage data...</p>
          </div>
        )}

        <div className='flex flex-col w-full justify-between h-full'>
          <ChartContainer config={config} className='h-[400px] w-full'>
            <AreaChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray='3 3' className='stroke-muted' />
              <XAxis
                dataKey='date'
                tickFormatter={formatChartDate}
                className='text-xs fill-muted-foreground'
              />
              <YAxis
                tickFormatter={(value: number) =>
                  formatMetricValue(value, selectedMetric)
                }
                className='text-xs fill-muted-foreground'
              />
              <ChartTooltip content={<ChartTooltipContent />} />
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

        {!isLoading && !error && chartData.length === 0 && (
          <div className='flex items-center justify-center p-8 bg-gray-50 rounded-md'>
            <p className='text-gray-600'>
              No usage data available for the selected date range.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default TestBucketUsage;
