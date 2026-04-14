import axios from 'axios';
import { managementAuthService } from './management-auth.service';

const API = () => `${import.meta.env.VITE_OBJECT_STORAGE_API_URL}/management`;
const headers = () => managementAuthService.getAuthHeaders();

export interface Partner {
  id: string;
  storageProviderId: string;
  name: string | null;
  email: string | null;
  status: 'ACTIVE' | 'DELETED';
  providerCreatedAt: string | null;
  activeStorageTb: number;
  subAccountsCount: number;
  createdAt: string;
}

export interface PartnersSummary {
  totalPartners: number;
  activeStorageTb: number;
}

export interface PartnersResponse {
  partners: Partner[];
  total: number;
}

export interface PartnerSubAccount {
  id: string;
  storageProviderId: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  email: string | null;
  activeStorageBytes: number;
  deletedStorageBytes: number;
  createdAt: string | null;
}

async function createPartner(dto: { name: string; email: string; password: string; country: string; postalCode: string }): Promise<void> {
  await axios.post(`${API()}/partners`, dto, { headers: headers() });
}

async function getPartners(params: {
  page?: number;
  perPage?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<PartnersResponse> {
  const response = await axios.get(`${API()}/partners`, {
    headers: headers(),
    params,
  });
  const data = response.data;
  const rawItems: any[] = Array.isArray(data) ? data : (data.items ?? []);
  return {
    partners: rawItems.map((raw) => ({
      id: raw.id,
      storageProviderId: raw.storageProviderId,
      name: raw.name ?? null,
      email: raw.email ?? null,
      status: raw.status === 'DELETED' ? 'DELETED' : 'ACTIVE',
      providerCreatedAt: raw.providerCreatedAt ?? null,
      activeStorageTb: raw.activeStorageTb ?? 0,
      subAccountsCount: raw.subAccountsCount ?? 0,
      createdAt: raw.createdAt ?? '',
    })),
    total: data.total ?? rawItems.length,
  };
}

async function getPartnersSummary(): Promise<PartnersSummary> {
  const response = await axios.get(`${API()}/partners/summary`, { headers: headers() });
  const data = response.data;
  return {
    totalPartners: data.totalPartners ?? 0,
    activeStorageTb: data.activeStorageTb ?? 0,
  };
}

async function getPartnerSubAccounts(
  partnerId: string,
  params: { page?: number; perPage?: number },
): Promise<{ items: PartnerSubAccount[]; total: number }> {
  const response = await axios.get(`${API()}/partners/${partnerId}/sub-accounts`, {
    headers: headers(),
    params,
  });
  return {
    items: response.data.items ?? [],
    total: response.data.total ?? 0,
  };
}

export const partnersService = {
  createPartner,
  getPartners,
  getPartnersSummary,
  getPartnerSubAccounts,
};
