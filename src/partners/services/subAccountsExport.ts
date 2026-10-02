import dayjs from 'dayjs';
import { SubAccount } from '../../management/services/management.service';
import { partnersService, SubAccountsQuery } from './partners.service';
import {
  exportAsXLSX,
  fetchAllPages,
  toXLSXDate,
  XLSX_DATE_FORMAT,
  XLSX_TB_FORMAT,
  XLSXColumn,
} from '../../utils/exportUtils';
import { statusLabel } from '../../utils/statusLabel';

const SUB_ACCOUNT_COLUMNS: XLSXColumn<SubAccount>[] = [
  { header: 'Client Name', value: (acc) => acc.name ?? '', width: 30 },
  { header: 'Account Email', value: (acc) => acc.email, width: 36 },
  { header: 'Status', value: (acc) => statusLabel(acc.status), width: 18 },
  { header: 'Active Storage (TB)', value: (acc) => acc.activeStorage, numFmt: XLSX_TB_FORMAT, width: 20 },
  { header: 'Deleted Storage (TB)', value: (acc) => acc.deletedStorage, numFmt: XLSX_TB_FORMAT, width: 20 },
  { header: 'Storage Quota (TB)', value: (acc) => acc.storageQuotaTb ?? 'No limit', width: 20 },
  {
    header: 'Quota Used (%)',
    value: (acc) => (acc.storageQuotaTb ? (acc.activeStorage / acc.storageQuotaTb) * 100 : null),
    numFmt: '0.00',
    width: 16,
  },
  { header: 'Created', value: (acc) => toXLSXDate(acc.creationDate), numFmt: XLSX_DATE_FORMAT, width: 14 },
];

/**
 * Export the authenticated partner's sub-accounts. Uses the same scoped endpoint
 * (and the same query) as the Sub-Accounts view, so visibility rules match.
 */
export const exportSubAccounts = (query: SubAccountsQuery): Promise<number> =>
  exportAsXLSX(
    fetchAllPages(async (page, perPage) => {
      const res = await partnersService.getSubAccounts({ ...query, page, perPage });
      return { items: res.subAccounts, total: res.total };
    }),
    SUB_ACCOUNT_COLUMNS,
    'Sub-Accounts',
    `sub_accounts_export_${dayjs().format('YYYY-MM-DD')}`,
  );
