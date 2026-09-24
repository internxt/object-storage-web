import { hasApiErrorStatus } from '../../utils/apiError';

export const MIN_STORAGE_LIMIT_TB = 1;
export const MAX_STORAGE_LIMIT_TB = 10;

export const storageLimitValidationError = (value: string): string | undefined => {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return `Enter a whole number of TB between ${MIN_STORAGE_LIMIT_TB} and ${MAX_STORAGE_LIMIT_TB}`;
  const limit = Number(trimmed);
  if (limit < MIN_STORAGE_LIMIT_TB || limit > MAX_STORAGE_LIMIT_TB) {
    return `The limit must be between ${MIN_STORAGE_LIMIT_TB} and ${MAX_STORAGE_LIMIT_TB} TB`;
  }
  return undefined;
};

const belowUsageMessage = (usedTb?: number): string =>
  usedTb == null
    ? "The limit can't be lower than the partner's current usage"
    : `The limit can't be lower than the partner's current usage (${usedTb.toFixed(2)} TB)`;

export const storageLimitSaveErrorMessage = (err: unknown, usedTb?: number): string =>
  hasApiErrorStatus(err, 400) ? belowUsageMessage(usedTb) : "We couldn't update the storage limit. Please try again.";
