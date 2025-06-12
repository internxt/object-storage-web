import { LoadingRowSkeleton } from '../LoadingSkeleton';
import { DownloadSimple } from '@phosphor-icons/react';
import { Invoice } from '../../services/payments.service';

export interface HeaderItemsTableProps {
  title: string;
  key: string;
}

export type BODY_STATE = 'loading' | 'empty' | 'items';

interface BillingTableProps {
  headers: HeaderItemsTableProps[];
  invoices: Invoice[];
  bodyState: BODY_STATE;
}
const getDate = (invoiceDate: number) => {
  const date = new Date(invoiceDate * 1000);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export const BillingTable = ({
  headers,
  invoices,
  bodyState,
}: BillingTableProps) => {
  const onDownloadInvoice = (invoice: Invoice) => {
    window.open(invoice.pdf, '_blank');
  };

  const renderCellValue = (invoice: Invoice, key: string) => {
    switch (key) {
      case 'invoice':
        return (
          <div className='flex flex-col'>
            <p className='text-primary font-medium'>{invoice.id}</p>
            <p className='text-sm text-gray-500'>{invoice.created}</p>
          </div>
        );
      case 'created':
        return getDate(invoice.created);
      case 'total':
        return <p className='text-black'>{invoice.total}</p>;
      default:
        return '-';
    }
  };

  return (
    <table className='w-full'>
      <thead>
        <tr className='w-full h-12 bg-gray-10 text-black text-sm'>
          {headers.map((header) => (
            <th key={header.key} className='w-[33%] px-5 text-left'>
              {header.title}
            </th>
          ))}
          <th className='w-[1%]' />
        </tr>
      </thead>
      <tbody>
        {bodyState === 'loading' && (
          <LoadingRowSkeleton
            numberOfColumns={headers.length + 1}
            numberOfRows={5}
            itemWidth='25%'
          />
        )}
        {bodyState === 'empty' && (
          <tr>
            <td
              colSpan={headers.length + 1}
              className='text-center py-4 text-sm text-gray-400'
            >
              No members found
            </td>
          </tr>
        )}
        {bodyState === 'items' &&
          invoices.map((invoice) => (
            <tr key={invoice.id} className='w-full h-12 text-sm text-gray-500'>
              {headers.map((header) => (
                <td key={header.key} className='px-5 text-left'>
                  {renderCellValue(invoice, header.key)}
                </td>
              ))}
              <td className='w-[1%] px-5'>
                <DownloadSimple
                  className='cursor-pointer'
                  size={24}
                  onClick={() => onDownloadInvoice(invoice)}
                />
              </td>
            </tr>
          ))}
      </tbody>
    </table>
  );
};
