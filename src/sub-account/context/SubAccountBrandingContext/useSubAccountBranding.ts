import { useContext } from 'react';
import { SubAccountBrandingContext } from '.';
import type { SubAccountBrandingContextValue } from './constants';

export function useSubAccountBranding(): SubAccountBrandingContextValue {
  const context = useContext(SubAccountBrandingContext);
  if (!context) {
    throw new Error('useSubAccountBranding must be used within a SubAccountBrandingProvider');
  }

  return context;
}
