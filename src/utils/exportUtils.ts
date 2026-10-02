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

export const XLSX_TB_FORMAT = '0.0000';
export const XLSX_DATE_FORMAT = 'yyyy-mm-dd';

export interface XLSXColumn<T> {
  header: string;
  value: (row: T) => string | number | Date | null;
  numFmt?: string;
  width: number;
}

/** Parse an API date string for an XLSX date cell; empty or invalid values become an empty cell. */
export const toXLSXDate = (value?: string | null): Date | null => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

/**
 * Export rows as an .xlsx workbook with a single sheet and resolve with the row count.
 * SheetJS is loaded on demand (so it stays out of the main bundle) while `rows` is still resolving.
 * @param filename Filename without extension.
 */
export const exportAsXLSX = async <T>(
  rows: T[] | Promise<T[]>,
  columns: XLSXColumn<T>[],
  sheetName: string,
  filename: string,
): Promise<number> => {
  const [XLSX, data] = await Promise.all([import('xlsx'), rows]);

  const aoa = [columns.map((c) => c.header), ...data.map((row) => columns.map((c) => c.value(row)))];
  const sheet = XLSX.utils.aoa_to_sheet(aoa, { cellDates: true });

  columns.forEach((col, colIdx) => {
    if (!col.numFmt) return;
    for (let rowIdx = 1; rowIdx <= data.length; rowIdx++) {
      const cell = sheet[XLSX.utils.encode_cell({ r: rowIdx, c: colIdx })];
      if (cell && (cell.t === 'n' || cell.t === 'd')) cell.z = col.numFmt;
    }
  });
  sheet['!cols'] = columns.map((c) => ({ wch: c.width }));
  sheet['!autofilter'] = {
    ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: data.length, c: columns.length - 1 } }),
  };

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
  XLSX.writeFile(workbook, `${filename}.xlsx`, { compression: true });
  return data.length;
};

const FETCH_ALL_PAGE_SIZE = 100;

/**
 * Collect every item of a paginated (0-based) list endpoint, one page at a time,
 * so large lists never depend on a single long-running request.
 */
export const fetchAllPages = async <T>(
  fetchPage: (page: number, perPage: number) => Promise<{ items: T[]; total: number }>,
): Promise<T[]> => {
  const all: T[] = [];
  for (let page = 0; ; page++) {
    const { items, total } = await fetchPage(page, FETCH_ALL_PAGE_SIZE);
    all.push(...items);
    if (items.length < FETCH_ALL_PAGE_SIZE || all.length >= total) return all;
  }
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
