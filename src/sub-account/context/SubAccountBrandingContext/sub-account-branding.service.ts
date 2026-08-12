import { Dispatch, SetStateAction } from 'react';
import { SubAccountBranding, subAccountBrandingService } from '../../services/sub-account-branding.service';
import { cacheBranding, getBrandingCacheKey, isSameBranding, mapToBranding, readCachedBranding } from './service';
import { DEFAULT_BRANDING } from './constants';

export async function loadBrandingForCustomHostname({
  cachedBranding,
  setBranding,
  setIsLoading,
}: {
  cachedBranding: SubAccountBranding | null;
  setBranding: Dispatch<SetStateAction<SubAccountBranding>>;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
}) {
  try {
    const cacheKey = getBrandingCacheKey();
    const hostname = window.location.hostname;
    const response = await subAccountBrandingService.getBrandingByHostname(hostname);
    const resolvedBranding = mapToBranding(response);

    // A 404 or malformed response leaves the existing cache unchanged.
    if (resolvedBranding) {
      applyAndCacheBranding({ cachedBranding, cacheKey, resolvedBranding, setBranding });
    }
  } catch {
    // Keep cached branding, or default branding when there is no cache.
  } finally {
    setIsLoading(false);
  }
}

export async function loadBrandingForSharedConsole({
  entityId,
  setBranding,
  setIsLoading,
}: {
  entityId: string;
  setBranding: Dispatch<SetStateAction<SubAccountBranding>>;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
}) {
  const cacheKey = getBrandingCacheKey(entityId);
  const cachedBranding = readCachedBranding(cacheKey);

  if (cachedBranding) {
    setBranding(cachedBranding);
  } else {
    setBranding(DEFAULT_BRANDING);
    setIsLoading(true);
  }

  try {
    const response = await subAccountBrandingService.getBrandingBySubAccountId(entityId);
    const resolvedBranding = mapToBranding(response);

    // A failed lookup never clears a valid cache.
    if (resolvedBranding) {
      applyAndCacheBranding({ cachedBranding, cacheKey, resolvedBranding, setBranding });
    }
  } catch {
    // Keep cached branding, or default branding when there is no cache.
  } finally {
    setIsLoading(false);
  }
}

function applyAndCacheBranding({
  cachedBranding,
  cacheKey,
  resolvedBranding,
  setBranding,
}: {
  cachedBranding: SubAccountBranding | null;
  cacheKey: string;
  resolvedBranding: SubAccountBranding;
  setBranding: Dispatch<SetStateAction<SubAccountBranding>>;
}) {
  /**
   * Keep cached branding stable for the current session.
   * A newer result is saved for the next page load instead of repainting the current console.
   */
  if (!cachedBranding) setBranding(resolvedBranding);

  if (!isSameBranding(readCachedBranding(cacheKey), resolvedBranding)) {
    cacheBranding(cacheKey, resolvedBranding);
  }
}
