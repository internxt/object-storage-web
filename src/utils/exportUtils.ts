import { Usage } from '../services/usage.service';

const toCommaDecimal = (value: number, decimals: number): string =>
  value.toFixed(decimals).replace('.', ',');

export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

/**
 * Export any array of records as CSV.
 * @param data          Array of plain objects (all must have the same keys).
 * @param numericFields Set of field names whose values should use comma as decimal separator.
 * @param filename      Filename without extension.
 */
export const exportAsCSV = (
  data: Record<string, unknown>[],
  numericFields: Set<string>,
  filename: string,
): void => {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers
      .map((h) => {
        const val = row[h] ?? '';
        return numericFields.has(h) && typeof val === 'number'
          ? toCommaDecimal(val, 9)
          : String(val);
      })
      .join(';'),
  );
  const csv = [headers.join(';'), ...rows].join('\n');
  downloadBlob(new Blob([csv], { type: 'text/csv' }), `${filename}.csv`);
};

// ─── Usage-specific helpers (used by UsagePage) ───────────────────────────────

const USAGE_NUMERIC_FIELDS = new Set([
  'Active Storage (TB)',
  'Deleted Storage (TB)',
  'Egress (GB)',
  'Ingress (GB)',
  'Storage Wrote (TB)',
  'Storage Read (TB)',
]);

const transformUsageData = (usageData: Usage[]): Record<string, unknown>[] =>
  usageData.map((usage) => ({
    'Record Date': usage.recordDate,
    'Active Storage (TB)': usage.activeStorage / 1024,
    'Deleted Storage (TB)': usage.deletedStorage / 1024,
    'Active Objects': usage.activeObjects,
    'Deleted Objects': usage.deletedObjects,
    'API Calls': usage.apiCalls,
    'Egress (GB)': usage.egress,
    'Ingress (GB)': usage.ingress,
    'Storage Wrote (TB)': (usage.storageWrote || 0) / 1024,
    'Storage Read (TB)': (usage.storageRead || 0) / 1024,
  }));

export const generateExportFilename = (startDate: string, endDate: string): string => {
  const fmt = (d: string) => new Date(d).toISOString().split('T')[0];
  return `account_usage_export_${fmt(startDate)}_to_${fmt(endDate)}`;
};

export const exportUsageData = (
  usageData: Usage[],
  startDate: string,
  endDate: string,
): void => {
  const data = transformUsageData(usageData);
  const filename = generateExportFilename(startDate, endDate);
  exportAsCSV(data, USAGE_NUMERIC_FIELDS, filename);
};
