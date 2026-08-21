import { contrastColour, darkenColour, DEFAULT_PRIMARY_COLOUR, HEX_COLOUR_PATTERN, hexToRgb, mixWithWhite } from '../../../utils/brandColour';
import { NEW_CONSOLE_URL } from '../../../utils/consoleUrl';
import { SubAccountBranding } from '../../services/sub-account-branding.service';
import { BRANDING_CACHE_KEY, BrandingStyles } from './constants';

const SHARED_CONSOLE_HOSTNAME = new URL(NEW_CONSOLE_URL).hostname.toLowerCase();

export function mapToBranding(value: unknown): SubAccountBranding | null {
  if (!value || typeof value !== 'object') return null;
  if (!('logoUrl' in value) || !('primaryColor' in value)) return null;

  const { logoUrl, primaryColor } = value;
  if (logoUrl !== null && typeof logoUrl !== 'string') return null;
  if (primaryColor !== null && (typeof primaryColor !== 'string' || !HEX_COLOUR_PATTERN.test(primaryColor))) return null;

  return {
    logoUrl,
    primaryColor,
  };
}

export function getBrandingCacheKey(subAccountId?: string): string {
  return subAccountId ? `${BRANDING_CACHE_KEY}:${subAccountId}` : BRANDING_CACHE_KEY;
}

export function readCachedBranding(cacheKey: string): SubAccountBranding | null {
  try {
    const cachedBranding = window.localStorage.getItem(cacheKey);
    return cachedBranding ? mapToBranding(JSON.parse(cachedBranding)) : null;
  } catch {
    return null;
  }
}

/**
 * Identifies the one hostname that hosts the shared, unbranded console.
 *
 * Every other hostname is resolved by the backend, which owns the mapping
 * between a partner and either an Internxt subdomain or a customer domain.
 */
export function isSharedConsoleHostname(hostname = window.location.hostname): boolean {
  return hostname.trim().toLowerCase() === SHARED_CONSOLE_HOSTNAME;
}

export function isSameBranding(first: SubAccountBranding | null, second: SubAccountBranding): boolean {
  return first?.logoUrl === second.logoUrl && first?.primaryColor === second.primaryColor;
}

export function cacheBranding(cacheKey: string, branding: SubAccountBranding): void {
  try {
    window.localStorage.setItem(cacheKey, JSON.stringify(branding));
  } catch {
    // Branding still works for this session when browser storage is unavailable.
  }
}

export function getBrandingStyles(primaryColor: string | null): BrandingStyles {
  const colour = primaryColor ?? DEFAULT_PRIMARY_COLOUR;
  const { red, green, blue } = hexToRgb(colour);
  // A 14% darker colour gives hover and active controls clear feedback.
  const darkColour = darkenColour(colour, 0.14);

  return {
    '--primary': colour,
    // 90% white leaves a 10% brand tint, matching the existing primary-10 token.
    '--primary-10': mixWithWhite(colour, 0.9),
    '--color-primary': `${red} ${green} ${blue}`,
    '--color-primary-dark': darkColour,
    '--sub-account-primary': colour,
    '--sub-account-primary-dark': `rgb(${darkColour})`,
    '--sub-account-primary-contrast': contrastColour(colour),
  };
}