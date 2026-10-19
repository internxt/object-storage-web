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

export const toStorageFields = (limit: StorageLimit) => ({
  storageQuotaTb: limit.type === 'quota' ? limit.valueTb : null,
  usageAlertTb: limit.type === 'alert' ? limit.valueTb : null,
});

export const storageLimitValueTb = (limit: StorageLimit) => (limit.type === 'none' ? null : limit.valueTb);

export const isSameStorageLimit = (a: StorageLimit, b: StorageLimit) =>
  a.type === b.type && storageLimitValueTb(a) === storageLimitValueTb(b);

export const STORAGE_LIMIT_TYPING_PATTERN: Record<Exclude<StorageLimitType, 'none'>, RegExp> = {
  alert: /^\d*(\.\d{0,2})?$/,
  quota: /^\d*$/,
};

export const isValidStorageLimit = (type: Exclude<StorageLimitType, 'none'>, value: string): boolean => {
  const parsed = Number(value);
  if (type === 'alert') return /^\d+(\.\d{1,2})?$/.test(value) && parsed > 0;
  return /^\d+$/.test(value) && parsed >= MIN_STORAGE_QUOTA_TB && parsed <= MAX_STORAGE_QUOTA_TB;
};

export const getStorageLimitStatus = (used: number, limit: Exclude<StorageLimit, { type: 'none' }>) => {
  const pct = limit.valueTb > 0 ? (used / limit.valueTb) * 100 : 0;
  return { pct, reached: used >= limit.valueTb, warning: pct >= QUOTA_WARNING_PCT };
};
