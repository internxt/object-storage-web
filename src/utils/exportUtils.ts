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

export const XLSX_DECIMAL_FORMAT = '0.0000';
export const XLSX_COUNT_FORMAT = '#,##0';
export const XLSX_DATE_FORMAT = 'yyyy-mm-dd';

type XLSXCell = string | number | null;

interface XLSXColumnLayout {
  header: string;
  numFmt?: string;
  width: number;
}

export interface XLSXColumn<T> extends XLSXColumnLayout {
  value: (row: T) => XLSXCell;
}

export interface XLSXSheet {
  name: string;
  columns: XLSXColumnLayout[];
  cells: XLSXCell[][];
}

export const xlsxSheet = <T>(name: string, columns: XLSXColumn<T>[], rows: T[]): XLSXSheet => ({
  name,
  columns,
  cells: rows.map((row) => columns.map((c) => c.value(row))),
});

const EXCEL_EPOCH_UTC = Date.UTC(1899, 11, 30);
const MS_PER_DAY = 86_400_000;

export const toXLSXDay = (value?: string | null): number | null => {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const [, y, m, d] = match.map(Number);
  return (Date.UTC(y, m - 1, d) - EXCEL_EPOCH_UTC) / MS_PER_DAY;
};

export interface XLSXWorkbook {
  filename: string;
  sheets: XLSXSheet[];
}

export const exportAsXLSX = async (workbook: XLSXWorkbook | Promise<XLSXWorkbook>): Promise<void> => {
  const [XLSX, { filename, sheets }] = await Promise.all([import('xlsx'), workbook]);
  const book = XLSX.utils.book_new();

  sheets.forEach(({ name, columns, cells }) => {
    const aoa = [columns.map((c) => c.header), ...cells];
    const sheet = XLSX.utils.aoa_to_sheet(aoa);

    columns.forEach((col, colIdx) => {
      if (!col.numFmt) return;
      for (let rowIdx = 1; rowIdx <= cells.length; rowIdx++) {
        const cell = sheet[XLSX.utils.encode_cell({ r: rowIdx, c: colIdx })];
        if (cell?.t === 'n') cell.z = col.numFmt;
      }
    });
    sheet['!cols'] = columns.map((c) => ({ wch: c.width }));
    sheet['!autofilter'] = {
      ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: cells.length, c: columns.length - 1 } }),
    };

    XLSX.utils.book_append_sheet(book, sheet, name);
  });

  XLSX.writeFile(book, `${filename}.xlsx`, { compression: true });
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

export const generateExportFilename = (
  startDate: string,
  endDate: string,
  prefix = 'account_usage_export',
): string => {
  const fmt = (d: string) => new Date(d).toISOString().split('T')[0];
  return `${prefix}_${fmt(startDate)}_to_${fmt(endDate)}`;
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
