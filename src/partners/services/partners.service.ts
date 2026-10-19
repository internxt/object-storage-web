import partnersAxios from '../core/partners-axios';
import { partnersAuthService } from './partners-auth.service';
import { SubAccount } from '../../management/services/management.service';
import { toConsoleStatus } from '../../utils/statusLabel';
import { StorageLimit, storageLimitValueTb } from '../../utils/storageLimits';

const API = '/partners';

export interface PartnersUsageSummary {
  totalSubAccounts: number;
  activeStorageTb: number;
  deletedStorageTb: number;
}

interface DbSubAccount {
  id: string;
  storageProviderId: string;
  storageProvider: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING_DELETION' | 'DELETED';
  email: string | null;
  name: string | null;
  activeStorageBytes: number;
  deletedStorageBytes: number;
  storageQuotaTb: number | null;
  usageAlertTb: number | null;
  createdAt: string;
}

const BYTES_TO_TB = 1 / 1_000_000_000_000;

function mapDbSubAccount(raw: DbSubAccount): SubAccount {
  return {
    id: raw.id,
    name: raw.name ?? null,
    email: raw.email ?? '',
    status: toConsoleStatus(raw.status),
    activeStorage: (raw.activeStorageBytes ?? 0) * BYTES_TO_TB,
    deletedStorage: (raw.deletedStorageBytes ?? 0) * BYTES_TO_TB,
    storageQuotaTb: raw.storageQuotaTb ?? null,
    usageAlertTb: raw.usageAlertTb ?? null,
    creationDate: raw.createdAt ? new Date(raw.createdAt).toISOString() : '',
    recordDate: '',
  };
}

export interface PartnerInfo {
  id: string;
  name: string | null;
  email: string | null;
  createdAt: string;
  automaticSubAccountCreationEnabled: boolean;
  twoFactorSetupRequired?: boolean;
  hasWholesaler?: boolean;
}

async function getMe(): Promise<PartnerInfo> {
  const response = await partnersAxios.get(`${API}/me`);
  return response.data;
}

async function getSubAccounts(params: {
  page?: number;
  perPage?: number;
  search?: string;
  status?: 'ACTIVE' | 'SUSPENDED' | 'PENDING_DELETION' | 'DELETED';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<{ subAccounts: SubAccount[]; total: number }> {
  const response = await partnersAxios.get(`${API}/sub-accounts`, { params });
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
  await partnersAxios.post(`${API}/sub-accounts`, dto);
}

async function updateSubAccountName(id: string, name: string): Promise<void> {
  await partnersAxios.patch(`${API}/sub-accounts/${id}`, { name });
}

async function suspendSubAccount(id: string): Promise<void> {
  await partnersAxios.put(`${API}/sub-accounts/${id}/suspend`, {});
}

async function reactivateSubAccount(id: string): Promise<void> {
  await partnersAxios.put(`${API}/sub-accounts/${id}/reactivate`, {});
}

async function deleteSubAccount(id: string): Promise<void> {
  await partnersAxios.delete(`${API}/sub-accounts/${id}`);
}

async function changeSubAccountPassword(id: string, newPassword: string): Promise<void> {
  await partnersAxios.patch(`${API}/sub-accounts/${id}/password`, { newPassword });
}

async function updateSubAccountStorageLimit(id: string, limit: StorageLimit): Promise<void> {
  await partnersAxios.patch(`${API}/sub-accounts/${id}/storage-limit`, {
    type: limit.type,
    valueTb: storageLimitValueTb(limit),
  });
}

async function getUsageSummary(): Promise<PartnersUsageSummary> {
  const response = await partnersAxios.get(`${API}/usages/summary`);
  return response.data;
}

async function getSubAccountById(id: string): Promise<import('../../management/services/management.service').SubAccountDetail> {
  const response = await partnersAxios.get(`${API}/sub-accounts/${id}`);
  return response.data;
}

async function getSubAccountUsages(
  id: string,
  params: { from: string; to: string; page?: number; perPage?: number },
): Promise<{ items: import('../../management/services/management.service').SubAccountUsage[]; totalItems: number }> {
  const response = await partnersAxios.get(`${API}/sub-accounts/${id}/usages`, { params });
  const data = response.data;
  return { items: data.items ?? [], totalItems: data.totalItems ?? data.items?.length ?? 0 };
}

export interface PartnerMember {
  id: string;
  email: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  twoFactorEnabled: boolean;
}

async function listMembers(): Promise<PartnerMember[]> {
  const response = await partnersAxios.get(`${API}/members`);
  return response.data;
}

async function createMember(email: string, password: string): Promise<void> {
  await partnersAxios.post(`${API}/members`, { email, password });
}

async function deleteMember(id: string): Promise<void> {
  await partnersAxios.delete(`${API}/members/${id}`);
}

async function updateMember(id: string, dto: { email?: string; newPassword?: string }): Promise<void> {
  await partnersAxios.patch(`${API}/members/${id}`, dto);
}

async function updateMemberTwoFactor(id: string, action: 'disable' | 'reset'): Promise<void> {
  await partnersAxios.patch(`${API}/members/${id}/tfa`, { action });
}

export interface DailyUsageEntry {
  date: string;
  usageGb: number;
}

async function exportDailyUsage(params?: { startDate?: string; endDate?: string }): Promise<DailyUsageEntry[]> {
  const response = await partnersAxios.get(`${API}/usages/export`, { params });
  return response.data;
}

export interface SubAccountUsageSummary {
  billedUnits: number;
  avgActiveStorageTb: number;
  avgDeletedStorageTb: number;
  peakActiveStorageTb: number;
  storageWroteTb: number;
  storageReadTb: number;
  egressGb: number;
  ingressGb: number;
  apiCalls: number;
  activeObjectsLastDay: number | null;
  daysWithData: number;
}

export interface SubAccountDailyUsage {
  date: string;
  activeStorageTb: number;
  deletedStorageTb: number;
  storageWroteTb: number;
  storageReadTb: number;
  activeObjects: number | null;
  deletedObjects: number | null;
  egressGb: number;
  ingressGb: number;
  apiCalls: number;
}

export interface SubAccountUsageItem {
  id: string;
  name: string | null;
  email: string;
  status: SubAccount['status'];
  storageQuotaTb: number | null;
  usageAlertTb: number | null;
  summary: SubAccountUsageSummary;
  daily: SubAccountDailyUsage[];
}

export interface SubAccountsUsageReport {
  from: string;
  to: string;
  items: SubAccountUsageItem[];
}

async function getSubAccountsUsage(params: { from: string; to: string }): Promise<SubAccountsUsageReport> {
  const response = await partnersAxios.get<SubAccountsUsageReport>(`${API}/usages/sub-accounts`, {
    params,
  });
  const report = response.data;
  return { ...report, items: report.items.map((item) => ({ ...item, status: toConsoleStatus(item.status) })) };
}

async function createBillingPortalSession(): Promise<{ url: string }> {
  const response = await partnersAxios.post<{ url: string }>(
    `${API}/billing-portal`,
    { returnUrl: window.location.href },
  );
  return response.data;
}

async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const response = await partnersAxios.put<{ token: string }>(`${API}/password`, { currentPassword, newPassword });
  partnersAuthService.setToken(response.data.token);
}

async function getTwoFactorStatus(): Promise<{ enabled: boolean }> {
  const response = await partnersAxios.get(`${API}/tfa/status`);
  return response.data;
}

async function getTwoFactorSetup(): Promise<{ secret: string; qrCode: string }> {
  const response = await partnersAxios.get(`${API}/tfa`);
  return response.data;
}

async function enableTwoFactor(code: string): Promise<void> {
  await partnersAxios.put(`${API}/tfa`, { code });
}

async function disableTwoFactor(password: string, code: string): Promise<void> {
  await partnersAxios.delete(`${API}/tfa`, { data: { password, code } });
}

export const partnersService = {
  getMe,
  exportDailyUsage,
  getSubAccounts,
  getSubAccountById,
  getSubAccountUsages,
  createSubAccount,
  updateSubAccountName,
  suspendSubAccount,
  reactivateSubAccount,
  deleteSubAccount,
  changeSubAccountPassword,
  updateSubAccountStorageLimit,
  getUsageSummary,
  getSubAccountsUsage,
  createBillingPortalSession,
  changePassword,
  listMembers,
  createMember,
  deleteMember,
  updateMember,
  updateMemberTwoFactor,
  getTwoFactorStatus,
  getTwoFactorSetup,
  enableTwoFactor,
  disableTwoFactor,
};
