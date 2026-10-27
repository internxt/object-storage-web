import wholesalersAxios from '../core/wholesalers-axios';
import { wholesalersAuthService } from './wholesalers-auth.service';

const API = '/wholesalers';

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
  const response = await wholesalersAxios.get(`${API}/partners`, { params });
  const data = response.data;
  return { partners: data.items ?? [], total: data.total ?? 0 };
}

async function createPartner(dto: { name: string; email: string; password: string }): Promise<void> {
  await wholesalersAxios.post(`${API}/partners`, dto);
}

async function updatePartnerName(id: string, name: string): Promise<void> {
  await wholesalersAxios.patch(`${API}/partners/${id}`, { name });
}

async function deletePartner(id: string): Promise<void> {
  await wholesalersAxios.delete(`${API}/partners/${id}`);
}

export interface WholesalerPartnerUsageSummary {
  totalSubAccounts: number;
  activeStorageTb: number;
  deletedStorageTb: number;
}

async function getPartnerUsageSummary(id: string): Promise<WholesalerPartnerUsageSummary> {
  const response = await wholesalersAxios.get(`${API}/partners/${id}/usages/summary`);
  return response.data;
}

export interface WholesalerUsageSummary {
  totalPartners: number;
  activeStorageTb: number;
}

async function getUsageSummary(): Promise<WholesalerUsageSummary> {
  const response = await wholesalersAxios.get(`${API}/usages/summary`);
  return response.data;
}

async function createBillingPortalSession(): Promise<{ url: string }> {
  const response = await wholesalersAxios.post<{ url: string }>(`${API}/billing-portal`, {
    returnUrl: window.location.href,
  });
  return response.data;
}

async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const response = await wholesalersAxios.put<{ token: string }>(`${API}/password`, { currentPassword, newPassword });
  wholesalersAuthService.setToken(response.data.token);
}

async function getTwoFactorStatus(): Promise<{ enabled: boolean }> {
  const response = await wholesalersAxios.get(`${API}/tfa/status`);
  return response.data;
}

async function getTwoFactorSetup(): Promise<{ secret: string; qrCode: string }> {
  const response = await wholesalersAxios.get(`${API}/tfa`);
  return response.data;
}

async function enableTwoFactor(code: string): Promise<void> {
  await wholesalersAxios.put(`${API}/tfa`, { code });
}

async function disableTwoFactor(password: string, code: string): Promise<void> {
  await wholesalersAxios.delete(`${API}/tfa`, { data: { password, code } });
}

export interface WholesalerProfile {
  id: string;
  name?: string;
  email: string;
  createdAt: string;
  twoFactorSetupRequired?: boolean;
}

async function getMe(): Promise<WholesalerProfile> {
  const response = await wholesalersAxios.get(`${API}/me`);
  return response.data;
}

export interface WholesalerMember {
  id: string;
  email: string;
  createdAt: string;
  twoFactorEnabled: boolean;
}

async function listMembers(): Promise<WholesalerMember[]> {
  const response = await wholesalersAxios.get(`${API}/members`);
  return response.data;
}

async function createMember(email: string, password: string): Promise<void> {
  await wholesalersAxios.post(`${API}/members`, { email, password });
}

async function updateMember(id: string, dto: { email?: string; newPassword?: string }): Promise<void> {
  await wholesalersAxios.patch(`${API}/members/${id}`, dto);
}

async function deleteMember(id: string): Promise<void> {
  await wholesalersAxios.delete(`${API}/members/${id}`);
}

async function updateMemberTwoFactor(id: string, action: 'disable' | 'reset'): Promise<void> {
  await wholesalersAxios.patch(`${API}/members/${id}/tfa`, { action });
}

export const wholesalersService = {
  getTwoFactorStatus,
  getTwoFactorSetup,
  enableTwoFactor,
  disableTwoFactor,
  getMe,
  listMembers,
  createMember,
  updateMember,
  deleteMember,
  updateMemberTwoFactor,
  changePassword,
  getPartners,
  createPartner,
  updatePartnerName,
  deletePartner,
  getPartnerUsageSummary,
  getUsageSummary,
  createBillingPortalSession,
};
