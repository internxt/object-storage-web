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

const RCS_TB = 1126.4; // Hardcoded Reserved Capacity Storage

export interface UsagesSummary {
  storageProviderId: string;
  date: string;
  usedBillableStorageTb: number;
  // Derived on the frontend
  totalReservedCapacityTB: number;
  remainingCapacityTB: number;
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

async function getUsagesSummary(date?: string): Promise<UsagesSummary | null> {
  const response = await axios.get(`${API()}/usages/summary`, {
    headers: headers(),
    params: date ? { date } : {},
  });
  const data = response.data;
  if (!data) return null;
  return {
    storageProviderId: data.storageProviderId,
    date: data.date,
    usedBillableStorageTb: data.usedBillableStorageTb,
    totalReservedCapacityTB: RCS_TB,
    remainingCapacityTB: RCS_TB - data.usedBillableStorageTb,
  };
}

export interface SubAccountDetail {
  id: number;
  name: string;
  contactEmail: string | null;
  status: 'ON_TRIAL' | 'PAID_ACCOUNT' | 'SUSPENDED';
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
