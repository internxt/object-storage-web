import { ReactNode } from 'react';
import { ArrowUp, ArrowDown } from '@phosphor-icons/react';
import { SubAccount } from '../services/management.service';

export type SortOrder = 'asc' | 'desc';

export interface ColumnDef {
  header: string;
  align?: 'left' | 'right';
  sortKey?: 'activeStorage';
  cell: (acc: SubAccount, isLast: boolean) => ReactNode;
}

interface Props {
  subAccounts: SubAccount[];
  columns: ColumnDef[];
  isLoading: boolean;
  sortOrder?: SortOrder;
  onSortActiveStorage?: (order: SortOrder) => void;
}

export const SubAccountsTable = ({ subAccounts, columns, isLoading, sortOrder, onSortActiveStorage }: Props) => {
  const handleActiveStorageSort = () => {
    onSortActiveStorage?.(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className='overflow-x-auto relative'>
      <div className={`absolute top-0 left-0 right-0 h-[2px] overflow-hidden transition-opacity duration-300 ${isLoading ? 'opacity-100' : 'opacity-0'}`}>
        <div className='h-full bg-indigo-400/30 w-full'>
          <div className='h-full bg-indigo-400 animate-loading-bar' />
        </div>
      </div>
      <table className='w-full text-sm text-left border-separate border-spacing-0'>
        <thead>
          <tr>
            {columns.map((col, i) => {
              const isSortable = !!col.sortKey;
              return (
                <th
                  key={i}
                  onClick={isSortable ? handleActiveStorageSort : undefined}
                  className={`px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-400 border-b border-gray-100 bg-white whitespace-nowrap ${col.align === 'right' ? 'text-right' : ''} ${isSortable ? 'cursor-pointer hover:text-gray-600 select-none' : ''}`}
                >
                  {isSortable ? (
                    <span className='inline-flex items-center gap-1 justify-end w-full'>
                      {col.header}
                      {sortOrder === 'asc' ? (
                        <ArrowUp size={11} weight='bold' className='text-indigo-400' />
                      ) : sortOrder === 'desc' ? (
                        <ArrowDown size={11} weight='bold' className='text-indigo-400' />
                      ) : (
                        <ArrowUp size={11} weight='bold' className='text-gray-200' />
                      )}
                    </span>
                  ) : col.header}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className={`transition-opacity duration-200 ${isLoading ? 'opacity-40' : 'opacity-100'}`}>
          {subAccounts.length === 0 && !isLoading ? (
            <tr>
              <td colSpan={columns.length} className='text-center py-16 text-gray-300 text-sm font-medium'>
                No sub-accounts found
              </td>
            </tr>
          ) : (
            subAccounts.map((acc, idx) => (
              <tr key={acc.id} className='group hover:bg-gray-50/80 transition-colors cursor-default'>
                {columns.map((col, i) => (
                  <td
                    key={i}
                    className={`px-4 py-3.5 ${idx < subAccounts.length - 1 ? 'border-b border-gray-50' : ''} ${col.align === 'right' ? 'text-right' : ''}`}
                  >
                    {col.cell(acc, idx === subAccounts.length - 1)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
