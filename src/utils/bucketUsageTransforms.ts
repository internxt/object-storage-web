import { BucketUsageItem } from '../services/buckets.service';

export type MetricType =
  | 'activeStorage'
  | 'deletedStorage'
  | 'egress'
  | 'ingress';

export interface MetricOption {
  value: MetricType;
  label: string;
  color: string;
  unit: string;
}

export const METRIC_OPTIONS: MetricOption[] = [
  {
    value: 'activeStorage',
    label: 'Storage usage',
    color: '#3b82f6',
    unit: 'storage',
  },
  {
    value: 'deletedStorage',
    label: 'Deleted storage',
    color: '#ef4444',
    unit: 'storage',
  },
  { value: 'egress', label: 'Downloads', color: '#10b981', unit: 'transfer' },
  { value: 'ingress', label: 'Uploads', color: '#f59e0b', unit: 'transfer' },
];

export interface ChartDataPoint {
  date: string;
  value: number;
  name: string;
  region: string;
  originalValue: number; // Keep original for reference
}

export const formatStorageValue = (valueInGB: number): string => {
  if (valueInGB >= 1024) {
    // Convert to TB
    return `${(valueInGB / 1024).toFixed(2)} TB`;
  } else if (valueInGB >= 1) {
    // Keep as GB
    return `${valueInGB.toFixed(3)} GB`;
  } else if (valueInGB >= 0.001) {
    // Convert to MB
    return `${(valueInGB * 1024).toFixed(2)} MB`;
  } else if (valueInGB >= 0.000001) {
    // Convert to KB
    return `${(valueInGB * 1024 * 1024).toFixed(2)} KB`;
  } else {
    // Convert to Bytes
    return `${(valueInGB * 1024 * 1024 * 1024).toFixed(0)} B`;
  }
};

export const formatTransferValue = (valueInGB: number): string => {
  return formatStorageValue(valueInGB);
};

export const formatMetricValue = (
  value: number,
  metricType: MetricType
): string => {
  const option = METRIC_OPTIONS.find((opt) => opt.value === metricType);

  if (!option) {
    return value.toString();
  }

  if (option.unit === 'storage') {
    return formatStorageValue(value);
  } else if (option.unit === 'transfer') {
    return formatTransferValue(value);
  }

  return value.toString();
};

export const transformBucketUsageForChart = (
  usageData: BucketUsageItem[],
  selectedMetric: MetricType
): ChartDataPoint[] => {
  return usageData
    .map((item) => ({
      date: item.startTime,
      value: item[selectedMetric],
      name: item.name,
      region: item.region,
      originalValue: item[selectedMetric],
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export const formatChartDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

export const aggregateUsageByDate = (
  usageData: BucketUsageItem[],
  selectedMetric: MetricType
): ChartDataPoint[] => {
  const aggregated = new Map<string, ChartDataPoint>();

  usageData.forEach((item) => {
    const date = item.startTime;
    const value = item[selectedMetric];

    if (aggregated.has(date)) {
      const existing = aggregated.get(date)!;
      existing.value += value;
      existing.originalValue += value;
    } else {
      aggregated.set(date, {
        date,
        value,
        name: 'All Buckets',
        region: 'Multiple',
        originalValue: value,
      });
    }
  });

  return Array.from(aggregated.values()).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
};
