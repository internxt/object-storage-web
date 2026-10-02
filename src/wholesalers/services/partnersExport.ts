import dayjs from 'dayjs';
import { WholesalerPartner, wholesalersService } from './wholesalers.service';
import {
  exportAsXLSX,
  fetchAllPages,
  toXLSXDate,
  XLSX_DATE_FORMAT,
  XLSX_TB_FORMAT,
  XLSXColumn,
} from '../../utils/exportUtils';
import { statusLabel } from '../../utils/statusLabel';

const PARTNER_COLUMNS: XLSXColumn<WholesalerPartner>[] = [
  { header: 'Client Name', value: (p) => p.name ?? '', width: 30 },
  { header: 'Email', value: (p) => p.email ?? '', width: 36 },
  { header: 'Sub-accounts', value: (p) => p.subAccountsCount, numFmt: '0', width: 14 },
  { header: 'Active Storage (TB)', value: (p) => p.activeStorageTb, numFmt: XLSX_TB_FORMAT, width: 20 },
  { header: 'Status', value: (p) => statusLabel(p.status), width: 14 },
  { header: 'Created', value: (p) => toXLSXDate(p.createdAt), numFmt: XLSX_DATE_FORMAT, width: 14 },
];

/**
 * Export the authenticated wholesaler's partners, using the same scoped endpoint
 * as the Partners view.
 */
export const exportPartners = (): Promise<number> =>
  exportAsXLSX(
    fetchAllPages(async (page, perPage) => {
      const res = await wholesalersService.getPartners({ page, perPage });
      return { items: res.partners, total: res.total };
    }),
    PARTNER_COLUMNS,
    'Partners',
    `partners_export_${dayjs().format('YYYY-MM-DD')}`,
  );
