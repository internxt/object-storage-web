import { type CSSProperties } from 'react';
import type { SubAccountBranding } from '../../services/sub-account-branding.service';

export const DEFAULT_BRANDING: SubAccountBranding = { logoUrl: null, primaryColor: null };
export const BRANDING_CACHE_KEY = 'sub-account-branding';

export type BrandingStyles = CSSProperties & Record<
  '--primary' | '--primary-10' | '--color-primary' | '--color-primary-dark' |
  '--sub-account-primary' | '--sub-account-primary-dark' | '--sub-account-primary-contrast',
  string
>;

export type SubAccountBrandingContextValue = {
  branding: SubAccountBranding;
  styles: BrandingStyles;
  isLoading: boolean;
};
