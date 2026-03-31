import axios from 'axios';
import { managementAuthService } from './management-auth.service';

const API = () => `${import.meta.env.VITE_OBJECT_STORAGE_API_URL}/management`;
const headers = () => managementAuthService.getAuthHeaders();

axios.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401 && !window.location.pathname.endsWith('/login')) {
      managementAuthService.logOut();
      window.location.href = '/management/login';
    }
    return Promise.reject(err);
  },
);

export interface SubAccount {
  id: string;
  name: string;
  email: string;
  channelAccount?: string;
  activeStorage: number;
  deletedStorage: number;
  storageUtilization?: number;
  storageQuotaTB?: number;
  creationDate: string;
  deletionDate?: string;
  trialExpiration?: string;
  mfa?: boolean;
  status: 'PAID_ACCOUNT' | 'SUSPENDED';
  recordDate: string;
}

export interface SubAccountsResponse {
  subAccounts: SubAccount[];
  total: number;
}

export interface CreateSubAccountDto {
  name: string;
  email: string;
  password: string;
  customerId: string;
  isTrial?: boolean;
  trialQuotaTB?: number;
  trialDays?: number;
}

export interface UsagesSummary {
  usedBillableStorageTb: number;
  totalReservedCapacityTB: number;
  remainingCapacityTB: number;
  momGrowthPercent: number | null;
}

// Shape returned by the backend DB (provider-agnostic)
interface DbSubAccount {
  id: string;
  name: string;
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

async function getSubAccounts(params: {
  page?: number;
  perPage?: number;
  status?: 'PAID_ACCOUNT' | 'SUSPENDED';
  name?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<SubAccountsResponse> {
  const response = await axios.get(`${API()}/sub-accounts`, {
    headers: headers(),
    params,
  });
  const data = response.data;
  const rawItems: DbSubAccount[] = Array.isArray(data) ? data : (data.items ?? []);
  return {
    subAccounts: rawItems.map(mapDbSubAccount),
    total: data.total ?? rawItems.length,
  };
}

async function createSubAccount(dto: CreateSubAccountDto): Promise<void> {
  await axios.post(`${API()}/sub-accounts`, dto, { headers: headers() });
}

async function suspendSubAccount(id: string): Promise<void> {
  await axios.put(`${API()}/sub-accounts/${id}/suspend`, {}, { headers: headers() });
}

async function reactivateSubAccount(id: string): Promise<void> {
  await axios.put(`${API()}/sub-accounts/${id}/reactivate`, {}, { headers: headers() });
}

async function getUsagesSummary(): Promise<UsagesSummary | null> {
  const response = await axios.get(`${API()}/usages/summary`, { headers: headers() });
  const data = response.data;
  if (!data) return null;
  return {
    usedBillableStorageTb: data.usedBillableStorageTb,
    totalReservedCapacityTB: data.totalReservedCapacityTB,
    remainingCapacityTB: data.remainingCapacityTB,
    momGrowthPercent: data.momGrowthPercent ?? null,
  };
}

export interface SubAccountDetail {
  id: number;
  name: string;
  contactEmail: string | null;
  status: 'PAID_ACCOUNT' | 'SUSPENDED';
  creationDate: string;
  activeStorage: number;
  deletedStorage: number;
  trialQuota: number | null;
  trialExpiration: string | null;
  wasabiAccountNumber: string;
  wasabiAccountName: string;
  country: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  website: string | null;
  address1: string | null;
  address2: string | null;
  mainPhone: string | null;
  billingPhone: string | null;
  billingEmail: string | null;
  channelAccountName?: string | null;
  ftpEnabled: boolean;
}

export interface SubAccountUsage {
  id: number;
  startTime: string;
  endTime: string;
  activeStorage: number;
  deletedStorage: number;
  storageWrote: number;
  storageRead: number;
  activeObjects: number;
  deletedObjects: number;
  egress: number;
  ingress: number;
  apiCalls: number;
}

export interface UpdateSubAccountDto {
  name?: string;
  contactEmail?: string;
  billingEmail?: string;
  mainPhone?: string;
  billingPhone?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  country?: string;
  zip?: string;
  businessNumber?: string;
  taxId?: string;
  website?: string;
}

async function updateSubAccount(id: string, dto: UpdateSubAccountDto): Promise<void> {
  await axios.patch(`${API()}/sub-accounts/${id}`, dto, { headers: headers() });
}

async function getSubAccountById(id: string): Promise<SubAccountDetail> {
  const response = await axios.get(`${API()}/sub-accounts/${id}`, { headers: headers() });
  return response.data;
}

async function getSubAccountUsages(
  id: string,
  params: { from: string; to: string; page?: number; perPage?: number },
): Promise<{ items: SubAccountUsage[]; totalItems: number }> {
  const response = await axios.get(`${API()}/sub-accounts/${id}/usages`, {
    headers: headers(),
    params,
  });
  const data = response.data;
  return { items: data.items ?? [], totalItems: data.totalItems ?? data.items?.length ?? 0 };
}

async function getInvoices(params: { from?: string; to?: string; page?: number; perPage?: number }) {
  const response = await axios.get(`${API()}/invoices`, {
    headers: headers(),
    params,
  });
  return response.data;
}

async function getBuckets(params: { from?: string; to?: string; page?: number; perPage?: number; name?: string; region?: string }) {
  const response = await axios.get(`${API()}/buckets`, {
    headers: headers(),
    params,
  });
  return response.data;
}

export const managementService = {
  getSubAccounts,
  getSubAccountById,
  updateSubAccount,
  getSubAccountUsages,
  createSubAccount,
  suspendSubAccount,
  reactivateSubAccount,
  getUsagesSummary,
  getInvoices,
  getBuckets,
};
