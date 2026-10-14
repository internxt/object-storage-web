import managementAxios from '../core/management-axios'
import { toConsoleStatus } from '../../utils/statusLabel'

const API = '/management'

export interface SubAccount {
  id: string
  name: string | null
  email: string
  channelAccount?: string
  partnerId?: string | null
  partnerName?: string | null
  activeStorage: number
  deletedStorage: number
  storageUtilization?: number
  storageQuotaTb?: number | null
  usageAlertTb?: number | null
  creationDate: string
  deletionDate?: string
  trialExpiration?: string
  mfa?: boolean
  status: 'PAID_ACCOUNT' | 'SUSPENDED' | 'PENDING_DELETION' | 'DELETED'
  recordDate: string
  customerId?: string | null
}

export interface SubAccountsResponse {
  subAccounts: SubAccount[]
  total: number
}

export interface CreateSubAccountDto {
  name: string
  email: string
  password: string
  country: string
  postalCode: string
  isTrial?: boolean
  trialQuotaTB?: number
  trialDays?: number
}

export interface UsagesSummary {
  usedBillableStorageTb: number
  totalReservedCapacityTB: number
  remainingCapacityTB: number
  momGrowthPercent: number | null
}

// Shape returned by the backend DB (provider-agnostic)
interface DbSubAccount {
  id: string
  name: string
  storageProviderId: string
  storageProvider: string
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING_DELETION' | 'DELETED'
  email: string | null
  partnerId?: string | null
  partnerName?: string | null
  activeStorageBytes: number
  deletedStorageBytes: number
  createdAt: string
  customerId?: string | null
}

const BYTES_TO_TB = 1 / 1_000_000_000_000

function mapDbSubAccount(raw: DbSubAccount): SubAccount {
  return {
    id: raw.id,
    name: raw.id,
    email: raw.email ?? '',
    partnerId: raw.partnerId ?? null,
    partnerName: raw.partnerName ?? null,
    status: toConsoleStatus(raw.status),
    activeStorage: (raw.activeStorageBytes ?? 0) * BYTES_TO_TB,
    deletedStorage: (raw.deletedStorageBytes ?? 0) * BYTES_TO_TB,
    creationDate: raw.createdAt ? new Date(raw.createdAt).toISOString() : '',
    recordDate: '',
    customerId: raw.customerId ?? null,
  }
}

async function getSubAccounts(params: {
  page?: number
  perPage?: number
  status?: 'PAID_ACCOUNT' | 'SUSPENDED' | 'DELETED'
  name?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}): Promise<SubAccountsResponse> {
  const response = await managementAxios.get(`${API}/sub-accounts`, { params })
  const data = response.data
  const rawItems: DbSubAccount[] = Array.isArray(data)
    ? data
    : (data.items ?? [])
  return {
    subAccounts: rawItems.map(mapDbSubAccount),
    total: data.total ?? rawItems.length,
  }
}

async function createSubAccount(dto: CreateSubAccountDto): Promise<void> {
  await managementAxios.post(`${API}/sub-accounts`, dto)
}

async function suspendSubAccount(id: string): Promise<void> {
  await managementAxios.put(`${API}/sub-accounts/${id}/suspend`, {})
}

async function reactivateSubAccount(id: string): Promise<void> {
  await managementAxios.put(`${API}/sub-accounts/${id}/reactivate`, {})
}

async function getUsagesSummary(): Promise<UsagesSummary | null> {
  const response = await managementAxios.get(`${API}/usages/summary`)
  const data = response.data
  if (!data) return null
  return {
    usedBillableStorageTb: data.usedBillableStorageTb,
    totalReservedCapacityTB: data.totalReservedCapacityTB,
    remainingCapacityTB: data.remainingCapacityTB,
    momGrowthPercent: data.momGrowthPercent ?? null,
  }
}

export interface SubAccountDetail {
  id: string
  contactEmail: string | null
  name?: string | null
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED'
  creationDate: string
  activeStorage: number
  deletedStorage: number
  trialQuota: number | null
  trialExpiration: string | null
  partnerId?: string | null
  partnerName?: string | null
  storageQuotaTb?: number | null
  usageAlertTb?: number | null
}

export interface SubAccountUsage {
  id: number
  startTime: string
  endTime: string
  activeStorage: number
  deletedStorage: number
  storageWrote: number
  storageRead: number
  activeObjects: number
  deletedObjects: number
  egress: number
  ingress: number
  apiCalls: number
}

export interface UpdateSubAccountDto {
  name?: string
  contactEmail?: string
  billingEmail?: string
  mainPhone?: string
  billingPhone?: string
  address1?: string
  address2?: string
  city?: string
  state?: string
  country?: string
  zip?: string
  businessNumber?: string
  taxId?: string
  website?: string
}

async function updateSubAccount(
  id: string,
  dto: UpdateSubAccountDto,
): Promise<void> {
  await managementAxios.patch(`${API}/sub-accounts/${id}`, dto)
}

async function getSubAccountById(id: string): Promise<SubAccountDetail> {
  const response = await managementAxios.get(`${API}/sub-accounts/${id}`)
  return response.data
}

async function getSubAccountUsages(
  id: string,
  params: { from: string; to: string; page?: number; perPage?: number },
): Promise<{ items: SubAccountUsage[]; totalItems: number }> {
  const response = await managementAxios.get(`${API}/sub-accounts/${id}/usages`, { params })
  const data = response.data
  return {
    items: data.items ?? [],
    totalItems: data.totalItems ?? data.items?.length ?? 0,
  }
}

async function getInvoices(params: {
  from?: string
  to?: string
  page?: number
  perPage?: number
}) {
  const response = await managementAxios.get(`${API}/invoices`, { params })
  return response.data
}

async function getBuckets(params: {
  from?: string
  to?: string
  page?: number
  perPage?: number
  name?: string
  region?: string
}) {
  const response = await managementAxios.get(`${API}/buckets`, { params })
  return response.data
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
}
