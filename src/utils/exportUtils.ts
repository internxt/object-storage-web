import { Usage } from '../services/usage.service';
import { ExportFormat } from '../components/usage/ExportModal';
import * as XLSX from 'xlsx';

const transformUsageDataForExport = (usageData: Usage[]) => {
  return usageData.map((usage) => ({
    'Record Date': usage.recordDate,
    'Active Storage (TB)': (usage.activeStorage / 1024).toFixed(9),
    'Deleted Storage (TB)': (usage.deletedStorage / 1024).toFixed(9),
    'Active Objects': usage.activeObjects,
    'Deleted Objects': usage.deletedObjects,
    'API Calls': usage.apiCalls,
    'Egress (GB)': usage.egress.toFixed(9),
    'Ingress (GB)': usage.ingress.toFixed(9),
    'Storage Wrote (TB)': ((usage.storageWrote || 0) / 1024).toFixed(9),
    'Storage Read (TB)': ((usage.storageRead || 0) / 1024).toFixed(9),
  }));
};

// Generate filename with date range
export const generateExportFilename = (
  startDate: string,
  endDate: string,
  format: ExportFormat
): string => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0];
  };

  const start = formatDate(startDate);
  const end = formatDate(endDate);
  const extension = format.toLowerCase();

  return `account_usage_export_${start}_to_${end}.${extension}`;
};

export const exportAsJSON = (
  usageData: Usage[],
  startDate: string,
  endDate: string
) => {
  const transformedData = transformUsageDataForExport(usageData);
  const jsonString = JSON.stringify(transformedData, null, 2);
  const filename = generateExportFilename(startDate, endDate, 'JSON');

  downloadFile(jsonString, filename, 'application/json');
};

export const exportAsCSV = (
  usageData: Usage[],
  startDate: string,
  endDate: string
) => {
  const transformedData = transformUsageDataForExport(usageData);

  if (transformedData.length === 0) {
    return;
  }

  const headers = Object.keys(transformedData[0]);

  const csvContent = [
    headers.join(','),
    ...transformedData.map((row) =>
      headers
        .map((header) => {
          const value = row[header as keyof typeof row];
          if (
            typeof value === 'string' &&
            (value.includes(',') || value.includes('"') || value.includes('\n'))
          ) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(',')
    ),
  ].join('\n');

  const filename = generateExportFilename(startDate, endDate, 'CSV');
  downloadFile(csvContent, filename, 'text/csv');
};

export const exportAsExcel = (
  usageData: Usage[],
  startDate: string,
  endDate: string
) => {
  const transformedData = transformUsageDataForExport(usageData);

  if (transformedData.length === 0) {
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(transformedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Account Usage');

  const filename = generateExportFilename(startDate, endDate, 'Excel').replace(
    '.excel',
    '.xlsx'
  );
  XLSX.writeFile(workbook, filename);
};

const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportUsageData = (
  usageData: Usage[],
  format: ExportFormat,
  startDate: string,
  endDate: string
) => {
  switch (format) {
    case 'JSON':
      exportAsJSON(usageData, startDate, endDate);
      break;
    case 'CSV':
      exportAsCSV(usageData, startDate, endDate);
      break;
    case 'Excel':
      exportAsExcel(usageData, startDate, endDate);
      break;
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
};
