export type StorageLimitType = 'none' | 'alert' | 'quota';

export type StorageLimit = { type: 'none' } | { type: 'alert' | 'quota'; valueTb: number };

export const MIN_STORAGE_QUOTA_TB = 1;
export const MAX_STORAGE_QUOTA_TB = 500;
const QUOTA_WARNING_PCT = 80;

export const STORAGE_LIMIT_LABELS: Record<StorageLimitType, string> = {
  none: 'No limit',
  alert: 'Usage alert',
  quota: 'Storage quota',
};

// An account has at most one limit; should both ever come back set, the quota is the one Wasabi enforces.
export const toStorageLimit = (storageQuotaTb?: number | null, usageAlertTb?: number | null): StorageLimit => {
  if (storageQuotaTb != null) return { type: 'quota', valueTb: storageQuotaTb };
  if (usageAlertTb != null) return { type: 'alert', valueTb: usageAlertTb };
  return { type: 'none' };
};

/** Why `value` is not a valid amount of TB for `type`, or null when it is. */
export const validateStorageLimit = (type: Exclude<StorageLimitType, 'none'>, value: string): string | null => {
  const parsed = Number(value);
  if (type === 'alert') {
    return /^\d+(\.\d{1,2})?$/.test(value) && parsed > 0
      ? null
      : 'Enter a usage alert greater than 0 TB, with up to 2 decimals';
  }
  return /^\d+$/.test(value) && parsed >= MIN_STORAGE_QUOTA_TB && parsed <= MAX_STORAGE_QUOTA_TB
    ? null
    : `Enter a storage quota as a whole number between ${MIN_STORAGE_QUOTA_TB} and ${MAX_STORAGE_QUOTA_TB} TB`;
};

export interface StorageLimitStatus {
  pct: number;
  reached: boolean;
  warning: boolean;
}

export const getStorageLimitStatus = (used: number, limit: StorageLimit): StorageLimitStatus => {
  if (limit.type === 'none') return { pct: 0, reached: false, warning: false };
  const pct = limit.valueTb > 0 ? (used / limit.valueTb) * 100 : 0;
  const reached = used >= limit.valueTb;
  // A storage quota warns from 80%; a usage alert is itself the warning threshold.
  return { pct, reached, warning: limit.type === 'quota' ? pct >= QUOTA_WARNING_PCT : reached };
};
