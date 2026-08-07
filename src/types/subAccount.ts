export interface SubAccount {
  id: string;
  name: string;
  email: string;
  channelAccount?: string;
  partnerId?: string | null;
  partnerName?: string | null;
  activeStorage: number;
  deletedStorage: number;
  storageUtilization?: number;
  storageQuotaTb?: number | null;
  creationDate: string;
  deletionDate?: string;
  trialExpiration?: string;
  mfa?: boolean;
  status: 'PAID_ACCOUNT' | 'SUSPENDED' | 'DELETED';
  recordDate: string;
  customerId?: string | null;
}

export interface SubAccountDetail {
  id: string;
  contactEmail: string | null;
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  creationDate: string;
  activeStorage: number;
  deletedStorage: number;
  trialQuota: number | null;
  trialExpiration: string | null;
  partnerId?: string | null;
  partnerName?: string | null;
  storageQuotaTb?: number | null;
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

export interface CreateSubAccountDto {
  name?: string;
  email: string;
  password: string;
  country: string;
  postalCode: string;
  isTrial?: boolean;
  trialQuotaTB?: number;
  trialDays?: number;
}
