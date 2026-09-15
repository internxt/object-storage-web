import axios from 'axios';
import { wholesalersAuthService } from './wholesalers-auth.service';
import notificationsService from '../../services/notifications.service';

const API = () => `${import.meta.env.VITE_OBJECT_STORAGE_API_URL}/wholesalers`;
const headers = () => wholesalersAuthService.getAuthHeaders();

axios.interceptors.response.use(
  (res) => res,
  (err) => {
    if (
      err?.response?.status === 401 &&
      window.location.pathname.startsWith('/wholesalers') &&
      !window.location.pathname.endsWith('/login')
    ) {
      wholesalersAuthService.logOut();
      notificationsService.error({ text: 'Session expired. Please log in again.' });
      window.location.href = '/wholesalers/login';
    }
    return Promise.reject(err);
  },
);

export interface WholesalerPartner {
  id: string;
  name: string | null;
  email: string | null;
  status: 'ACTIVE' | 'DELETED';
  activeStorageTb: number;
  subAccountsCount: number;
  createdAt: string;
}

async function getPartners(params: { page?: number; perPage?: number }): Promise<{
  partners: WholesalerPartner[];
  total: number;
}> {
  const response = await axios.get(`${API()}/partners`, { headers: headers(), params });
  const data = response.data;
  return { partners: data.items ?? [], total: data.total ?? 0 };
}

async function createPartner(dto: { name: string; email: string; password: string }): Promise<void> {
  await axios.post(`${API()}/partners`, dto, { headers: headers() });
}

export interface WholesalerPartnerUsageSummary {
  totalSubAccounts: number;
  activeStorageTb: number;
  deletedStorageTb: number;
}

async function getPartnerUsageSummary(id: string): Promise<WholesalerPartnerUsageSummary> {
  const response = await axios.get(`${API()}/partners/${id}/usages/summary`, { headers: headers() });
  return response.data;
}

async function createBillingPortalSession(): Promise<{ url: string }> {
  const response = await axios.post<{ url: string }>(
    `${API()}/billing-portal`,
    { returnUrl: window.location.href },
    { headers: headers() },
  );
  return response.data;
}

export const wholesalersService = {
  getPartners,
  createPartner,
  getPartnerUsageSummary,
  createBillingPortalSession,
};
