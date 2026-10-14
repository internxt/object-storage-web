const QUOTA_WARNING_PCT = 80;

export interface StorageLimitStatus {
  pct: number;
  quotaReached: boolean;
  alertReached: boolean;
  warning: boolean;
}

export const getStorageLimitStatus = (
  used: number,
  quota: number | null,
  usageAlert: number | null,
): StorageLimitStatus => {
  const pct = quota ? (used / quota) * 100 : 0;
  const alertReached = usageAlert != null && used >= usageAlert;
  return {
    pct,
    quotaReached: quota != null && used >= quota,
    alertReached,
    // A usage alert replaces the default 80% warning threshold; without one it behaves as before.
    warning: usageAlert != null ? alertReached : pct >= QUOTA_WARNING_PCT,
  };
};
