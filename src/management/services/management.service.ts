import axios from 'axios';
import { managementAuthService } from './management-auth.service';

const API = () => `${import.meta.env.VITE_OBJECT_STORAGE_API_URL}/management`;
const headers = () => managementAuthService.getAuthHeaders();

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
  status: 'ON_TRIAL' | 'PAID_ACCOUNT' | 'SUSPENDED';
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

export interface UsageRecord {
  activeStorage: number;
  deletedStorage: number;
  activeObjects: number;
  deletedObjects: number;
  apiCalls: number;
  egress: number;
  ingress: number;
  recordDate: string;
}

export interface UsagesResponse {
  usages: UsageRecord[];
  totalReservedCapacity?: number;
  totalAllocatedStorage?: number;
  usedBillableStorage?: number;
  remainingCapacity?: number;
  subAccountStorage?: number;
  controlAccountStorage?: number;
  totalActiveObjects?: number;
  totalDeletedObjects?: number;
}

// Shape returned by Wasabi via the backend
interface WasabiSubAccount {
  id: number;
  name: string;
  contactEmail?: string;
  status: 'ON_TRIAL' | 'PAID_ACCOUNT' | 'SUSPENDED';
  creationDate?: string;
  deletionDate?: string;
  trialExpiration?: string;
  activeStorage?: number;
  deletedStorage?: number;
  trialQuotaTB?: number;
  purchasedStorageTB?: number;
  mfaEnabled?: boolean;
  recordDate?: string;
  channelAccountName?: string;
}

function mapWasabiSubAccount(raw: WasabiSubAccount): SubAccount {
  return {
    id: String(raw.id),
    name: raw.name,
    email: raw.contactEmail ?? '',
    status: raw.status,
    activeStorage: raw.activeStorage ?? 0,
    deletedStorage: raw.deletedStorage ?? 0,
    storageQuotaTB: raw.purchasedStorageTB ?? raw.trialQuotaTB,
    creationDate: raw.creationDate ?? '',
    deletionDate: raw.deletionDate,
    trialExpiration: raw.trialExpiration,
    mfa: raw.mfaEnabled,
    recordDate: raw.recordDate ?? '',
    channelAccount: raw.channelAccountName,
  };
}

async function getSubAccounts(params: {
  page?: number;
  perPage?: number;
  status?: 'ON_TRIAL' | 'PAID_ACCOUNT' | 'SUSPENDED';
  name?: string;
}): Promise<SubAccountsResponse> {
  const response = await axios.get(`${API()}/sub-accounts`, {
    headers: headers(),
    params,
  });
  const data = response.data;
  // Wasabi returns { items: [...], totalItems?: number } or similar
  const rawItems: WasabiSubAccount[] = data.items ?? data.subAccounts ?? [];
  return {
    subAccounts: rawItems.map(mapWasabiSubAccount),
    total: data.totalItems ?? data.total ?? rawItems.length,
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

async function getUsages(from: string, to: string, page = 0, perPage = 20): Promise<UsagesResponse> {
  const response = await axios.get(`${API()}/usages`, {
    headers: headers(),
    params: { from, to, page, perPage },
  });
  return response.data;
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
  createSubAccount,
  suspendSubAccount,
  reactivateSubAccount,
  getUsages,
  getInvoices,
  getBuckets,
};
