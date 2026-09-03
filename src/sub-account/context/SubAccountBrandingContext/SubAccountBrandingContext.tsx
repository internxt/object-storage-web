import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { useSubAccount } from '../SubAccountContext';
import { type SubAccountBranding } from '../../services/sub-account-branding.service';
import { SubAccountBrandingContext } from '.';
import {
  getBrandingCacheKey,
  getBrandingStyles,
  isSharedConsoleHostname,
  readCachedBranding,
} from './service';
import { DEFAULT_BRANDING } from './constants';
import { loadBrandingForCustomHostname, loadBrandingForSharedConsole } from './sub-account-branding.service';



export const SubAccountBrandingProvider = ({ children }: { children: ReactNode }) => {
  const { entityId } = useSubAccount();
  const isSharedConsole = isSharedConsoleHostname();
  const cachedHostnameBranding = useMemo(() => {
    if (isSharedConsoleHostname()) return null;

    return readCachedBranding(getBrandingCacheKey());
  }, []);
  const [branding, setBranding] = useState<SubAccountBranding>(cachedHostnameBranding ?? DEFAULT_BRANDING);
  const [isLoading, setIsLoading] = useState(!isSharedConsole && cachedHostnameBranding === null);

  useEffect(function loadBranding() {
    if (isSharedConsole) {
      if (!entityId) {
        setBranding(DEFAULT_BRANDING);
        setIsLoading(false);
        return;
      }

      void loadBrandingForSharedConsole({ entityId, setBranding, setIsLoading });
      return;
    }

    void loadBrandingForCustomHostname({
      setBranding,
      setIsLoading,
    });
  }, [cachedHostnameBranding, entityId, isSharedConsole]);

  const value = useMemo(
    () => ({ branding, styles: getBrandingStyles(branding.primaryColor), isLoading }),
    [branding, isLoading],
  );

  return <SubAccountBrandingContext.Provider value={value}>{children}</SubAccountBrandingContext.Provider>;
};
