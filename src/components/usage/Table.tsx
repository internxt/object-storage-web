import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { Usage } from '../../services/usage.service';
import { LoadingRowSkeleton } from '../LoadingSkeleton';
import { BODY_STATE } from '../../views/UsagePage';

dayjs.extend(utc);
dayjs.extend(timezone);

export interface HeaderItemsTableProps {
  title: string;
  key: string;
}

interface UsageTableProps {
  headers: HeaderItemsTableProps[];
  bodyState: BODY_STATE;
  usage: Usage[];
}

const formatStorageToTB = (valueInGB: number): string => {
  const valueInTB = valueInGB / 1024;
  const roundedValue = Math.ceil(valueInTB * 1000) / 1000;
  return roundedValue.toFixed(3);
};

const formatNumber = (value: number): string => {
  return value.toFixed(3);
};

const formatInteger = (value: number): string => {
  return value.toLocaleString();
};

export const UsageTable = ({ headers, bodyState, usage }: UsageTableProps) => {
  const renderCellValue = (usage: Usage, key: string) => {
    switch (key) {
      case 'recordDate':
        return usage.recordDate;
      case 'activeStorage':
        return formatStorageToTB(usage.activeStorage);
      case 'deletedStorage':
        return formatStorageToTB(usage.deletedStorage);
      case 'activeObjects':
        return formatInteger(usage.activeObjects);
      case 'deletedObjects':
        return formatInteger(usage.deletedObjects);
      case 'apiCalls':
        return formatInteger(usage.apiCalls);
      case 'egress':
        return formatNumber(usage.egress);
      case 'ingress':
        return formatNumber(usage.ingress);
      default:
        return '-';
    }
  };

  return (
    <table className='w-full'>
      <thead>
        <tr className='w-full h-12 bg-gray-10 text-black text-sm'>
          {headers.map((header) => (
            <th key={header.key} className='px-5 text-left'>
              {header.title}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {bodyState === 'loading' && (
          <LoadingRowSkeleton
            numberOfColumns={headers.length}
            numberOfRows={5}
            itemWidth='25%'
          />
        )}
        {bodyState === 'empty' && (
          <tr>
            <td
              colSpan={headers.length}
              className='text-center py-4 text-sm text-gray-400'
            >
              There are no results to show
            </td>
          </tr>
        )}
        {bodyState === 'items' &&
          usage.map((usageItem) => (
            <tr
              key={usageItem.id}
              className='w-full h-12 text-sm text-gray-500'
            >
              {headers.map((header) => (
                <td key={header.key} className='px-5 text-left'>
                  {renderCellValue(usageItem, header.key)}
                </td>
              ))}
            </tr>
          ))}
      </tbody>
    </table>
  );
};
