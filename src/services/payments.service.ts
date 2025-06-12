import axiosInstance from '../core/config/axios';

export interface Invoice {
  id: string;
  created: number;
  pdf: string;
  total: number;
  product: string;
}

const getInvoices = async (): Promise<Invoice[]> => {
  const response = await axiosInstance.get<Invoice[]>(
    `${import.meta.env.VITE_PAYMENTS_API_URL}/object-storage/invoices`
  );
  return response.data;
};

export const paymentsService = {
  getInvoices,
};
