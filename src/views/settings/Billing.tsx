import { useEffect, useState } from 'react';
import { Invoice, paymentsService } from '../../services/payments.service';
import {
  BillingTable,
  BODY_STATE,
  HeaderItemsTableProps,
} from '../../components/settings/BillingTable';

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
    <BillingTable
      headers={TABLE_HEADERS}
      invoices={invoices}
      bodyState={tableBodyState}
    />
  );
};

export default Billing;
