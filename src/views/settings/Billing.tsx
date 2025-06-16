import { useEffect, useState } from 'react';
import { Invoice, paymentsService } from '../../services/payments.service';
import {
  BillingTable,
  BODY_STATE,
  HeaderItemsTableProps,
} from '../../components/settings/BillingTable';
import { Separator } from '../../components/Separator';

const TABLE_HEADERS: HeaderItemsTableProps[] = [
  {
    title: 'Date',
    key: 'created',
  },
  {
    title: 'Total',
    key: 'total',
  },
];

const Billing = () => {
  const [tableBodyState, setTableBodyState] = useState<BODY_STATE>('loading');
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    getInvoices();
  }, []);

  const getInvoices = async () => {
    try {
      setTableBodyState('loading');
      const invoicesList = await paymentsService.getInvoices();

      if (invoicesList.length === 0) {
        setTableBodyState('empty');
      } else {
        setTableBodyState('items');
      }

      setInvoices(invoicesList);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setTableBodyState('empty');
    }
  };

  return (
    <div className='flex flex-col rounded-md bg-white gap-7 p-7'>
      <div className='flex flex-row w-full justify-between items-center'>
        <p className='text-xl font-semibold'>Billing</p>
      </div>
      <Separator />
      <div className='flex flex-col w-full gap-4'>
        <BillingTable
          headers={TABLE_HEADERS}
          invoices={invoices}
          bodyState={tableBodyState}
        />
      </div>
    </div>
  );
};

export default Billing;
