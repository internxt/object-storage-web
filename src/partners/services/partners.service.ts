import axios from 'axios';
import { partnersAuthService } from './partners-auth.service';
import { SubAccount } from '../../management/services/management.service';
import notificationsService from '../../services/notifications.service';

const API = () => `${import.meta.env.VITE_OBJECT_STORAGE_API_URL}/partners`;
const headers = () => partnersAuthService.getAuthHeaders();

axios.interceptors.response.use(
  (res) => res,
  (err) => {
    if (
      err?.response?.status === 401 &&
      window.location.pathname.startsWith('/partners') &&
      !window.location.pathname.endsWith('/login')
    ) {
      partnersAuthService.logOut();
      notificationsService.error({ text: 'Session expired. Please log in again.' });
      window.location.href = '/partners/login';
    }
    return Promise.reject(err);
  },
);

export interface PartnersUsageSummary {
  totalSubAccounts: number;
  activeStorageTb: number;
  deletedStorageTb: number;
}

interface DbSubAccount {
  id: string;
  storageProviderId: string;
  storageProvider: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  email: string | null;
  activeStorageBytes: number;
  deletedStorageBytes: number;
  createdAt: string;
}

const BYTES_TO_TB = 1 / 1_000_000_000_000;

function mapDbSubAccount(raw: DbSubAccount): SubAccount {
  return {
    id: raw.id,
    name: raw.id,
    email: raw.email ?? '',
    status: raw.status === 'SUSPENDED' ? 'SUSPENDED' : 'PAID_ACCOUNT',
    activeStorage: (raw.activeStorageBytes ?? 0) * BYTES_TO_TB,
    deletedStorage: (raw.deletedStorageBytes ?? 0) * BYTES_TO_TB,
    creationDate: raw.createdAt ? new Date(raw.createdAt).toISOString() : '',
    recordDate: '',
  };
}

async function getMe(): Promise<{ id: string; name: string | null; email: string | null }> {
  const response = await axios.get(`${API()}/me`, { headers: headers() });
  return response.data;
}

async function getSubAccounts(params: {
  page?: number;
  perPage?: number;
  email?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<{ subAccounts: SubAccount[]; total: number }> {
  const response = await axios.get(`${API()}/sub-accounts`, { headers: headers(), params });
  const data = response.data;
  const rawItems: DbSubAccount[] = data.items ?? [];
  return { subAccounts: rawItems.map(mapDbSubAccount), total: data.total ?? rawItems.length };
}

async function createSubAccount(dto: {
  name: string;
  email: string;
  password: string;
  country?: string;
  postalCode?: string;
  companyVatId?: string;
}): Promise<void> {
  await axios.post(`${API()}/sub-accounts`, dto, { headers: headers() });
}

async function suspendSubAccount(id: string): Promise<void> {
  await axios.put(`${API()}/sub-accounts/${id}/suspend`, {}, { headers: headers() });
}

async function reactivateSubAccount(id: string): Promise<void> {
  await axios.put(`${API()}/sub-accounts/${id}/reactivate`, {}, { headers: headers() });
}

async function getUsageSummary(): Promise<PartnersUsageSummary> {
  const response = await axios.get(`${API()}/usages/summary`, { headers: headers() });
  return response.data;
}

async function getSubAccountById(id: string): Promise<import('../../management/services/management.service').SubAccountDetail> {
  const response = await axios.get(`${API()}/sub-accounts/${id}`, { headers: headers() });
  return response.data;
}

async function getSubAccountUsages(
  id: string,
  params: { from: string; to: string; page?: number; perPage?: number },
): Promise<{ items: import('../../management/services/management.service').SubAccountUsage[]; totalItems: number }> {
  const response = await axios.get(`${API()}/sub-accounts/${id}/usages`, { headers: headers(), params });
  const data = response.data;
  return { items: data.items ?? [], totalItems: data.totalItems ?? data.items?.length ?? 0 };
}

export interface PartnerMember {
  id: string;
  email: string;
  entityType: string;
  entityId: string;
  createdAt: string;
}

async function listMembers(): Promise<PartnerMember[]> {
  const response = await axios.get(`${API()}/members`, { headers: headers() });
  return response.data;
}

async function createMember(email: string, password: string): Promise<void> {
  await axios.post(`${API()}/members`, { email, password }, { headers: headers() });
}

async function deleteMember(id: string): Promise<void> {
  await axios.delete(`${API()}/members/${id}`, { headers: headers() });
}

async function updateMember(id: string, dto: { email?: string; newPassword?: string }): Promise<void> {
  await axios.patch(`${API()}/members/${id}`, dto, { headers: headers() });
}

async function createBillingPortalSession(): Promise<{ url: string }> {
  const response = await axios.post<{ url: string }>(
    `${API()}/billing-portal`,
    { returnUrl: window.location.href },
    { headers: headers() },
  );
  return response.data;
}

async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const response = await axios.put<{ token: string }>(`${API()}/password`, { currentPassword, newPassword }, { headers: headers() });
  partnersAuthService.setToken(response.data.token);
}

export const partnersService = {
  getMe,
  getSubAccounts,
  getSubAccountById,
  getSubAccountUsages,
  createSubAccount,
  suspendSubAccount,
  reactivateSubAccount,
  getUsageSummary,
  createBillingPortalSession,
  changePassword,
  listMembers,
  createMember,
  deleteMember,
  updateMember,
};
