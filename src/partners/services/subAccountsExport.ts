import {
  partnersService,
  SubAccountDailyUsage,
  SubAccountsUsageReport,
  SubAccountUsageItem,
} from './partners.service';
import {
  exportAsXLSX,
  generateExportFilename,
  toXLSXDay,
  xlsxSheet,
  XLSX_COUNT_FORMAT,
  XLSX_DATE_FORMAT,
  XLSX_DECIMAL_FORMAT,
  XLSXColumn,
  XLSXWorkbook,
} from '../../utils/exportUtils';
import { statusLabel } from '../../utils/statusLabel';
import { ExportDateRange } from '../../components/ExportDateRangeModal';

const SUMMARY_COLUMNS: XLSXColumn<SubAccountUsageItem>[] = [
  { header: 'Name', value: (acc) => acc.name ?? '', width: 30 },
  { header: 'Account Email', value: (acc) => acc.email, width: 36 },
  { header: 'Status', value: (acc) => statusLabel(acc.status), width: 18 },
  { header: 'Avg Active Storage (TB)', value: (acc) => acc.summary.avgActiveStorageTb, numFmt: XLSX_DECIMAL_FORMAT, width: 24 },
  { header: 'Avg Deleted Storage (TB)', value: (acc) => acc.summary.avgDeletedStorageTb, numFmt: XLSX_DECIMAL_FORMAT, width: 24 },
  { header: 'Peak Active Storage (TB)', value: (acc) => acc.summary.peakActiveStorageTb, numFmt: XLSX_DECIMAL_FORMAT, width: 24 },
  { header: 'Storage Wrote (TB)', value: (acc) => acc.summary.storageWroteTb, numFmt: XLSX_DECIMAL_FORMAT, width: 20 },
  { header: 'Storage Read (TB)', value: (acc) => acc.summary.storageReadTb, numFmt: XLSX_DECIMAL_FORMAT, width: 20 },
  { header: 'Egress (GB)', value: (acc) => acc.summary.egressGb, numFmt: XLSX_DECIMAL_FORMAT, width: 16 },
  { header: 'Ingress (GB)', value: (acc) => acc.summary.ingressGb, numFmt: XLSX_DECIMAL_FORMAT, width: 16 },
  { header: 'API Calls', value: (acc) => acc.summary.apiCalls, numFmt: XLSX_COUNT_FORMAT, width: 14 },
  { header: 'Active Objects (last day)', value: (acc) => acc.summary.activeObjectsLastDay, numFmt: XLSX_COUNT_FORMAT, width: 24 },
  { header: 'Days with data', value: (acc) => acc.summary.daysWithData, width: 16 },
];

type DailyRow = SubAccountDailyUsage & { name: string; email: string };

const DAILY_COLUMNS: XLSXColumn<DailyRow>[] = [
  { header: 'Name', value: (row) => row.name, width: 30 },
  { header: 'Account Email', value: (row) => row.email, width: 36 },
  { header: 'Date', value: (row) => toXLSXDay(row.date), numFmt: XLSX_DATE_FORMAT, width: 14 },
  { header: 'Active Storage (TB)', value: (row) => row.activeStorageTb, numFmt: XLSX_DECIMAL_FORMAT, width: 20 },
  { header: 'Deleted Storage (TB)', value: (row) => row.deletedStorageTb, numFmt: XLSX_DECIMAL_FORMAT, width: 20 },
  { header: 'Storage Wrote (TB)', value: (row) => row.storageWroteTb, numFmt: XLSX_DECIMAL_FORMAT, width: 20 },
  { header: 'Storage Read (TB)', value: (row) => row.storageReadTb, numFmt: XLSX_DECIMAL_FORMAT, width: 20 },
  { header: 'Active Objects', value: (row) => row.activeObjects, numFmt: XLSX_COUNT_FORMAT, width: 16 },
  { header: 'Deleted Objects', value: (row) => row.deletedObjects, numFmt: XLSX_COUNT_FORMAT, width: 16 },
  { header: 'Egress (GB)', value: (row) => row.egressGb, numFmt: XLSX_DECIMAL_FORMAT, width: 16 },
  { header: 'Ingress (GB)', value: (row) => row.ingressGb, numFmt: XLSX_DECIMAL_FORMAT, width: 16 },
  { header: 'API Calls', value: (row) => row.apiCalls, numFmt: XLSX_COUNT_FORMAT, width: 14 },
];

const byClient = (a: SubAccountUsageItem, b: SubAccountUsageItem) =>
  (a.name || a.email).localeCompare(b.name || b.email, undefined, { sensitivity: 'base' });

const buildWorkbook = ({ from, to, items }: SubAccountsUsageReport): XLSXWorkbook => {
  const sorted = [...items].sort(byClient);
  const daily: DailyRow[] = sorted.flatMap((acc) =>
    [...acc.daily]
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((row) => ({ ...row, name: acc.name ?? '', email: acc.email })),
  );
  return {
    filename: generateExportFilename(from, to, 'sub_accounts_usage'),
    sheets: [
      xlsxSheet('Summary', SUMMARY_COLUMNS, sorted),
      xlsxSheet('Daily usage', DAILY_COLUMNS, daily),
    ],
  };
};

export const exportSubAccountsUsage = async (range: ExportDateRange): Promise<number> => {
  const report = partnersService.getSubAccountsUsage(range);
  await exportAsXLSX(report.then(buildWorkbook));
  return (await report).items.length;
};
