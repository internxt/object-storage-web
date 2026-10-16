import { useEffect, useState } from 'react';
import { subAccountSettingsService } from '../services/sub-account-settings.service';

export function usePublicSharingEnabled(entityId: string | null) {
  const [isEnabled, setIsEnabled] = useState<boolean | null>(null);
  const [hasLoadFailed, setHasLoadFailed] = useState(false);

  useEffect(() => {
    if (!entityId) return;
    setIsEnabled(null);
    setHasLoadFailed(false);
    subAccountSettingsService
      .getSettings(entityId)
      .then((settings) => setIsEnabled(settings.publicSharingEnabled))
      .catch(() => setHasLoadFailed(true));
  }, [entityId]);

  return { isEnabled, setIsEnabled, hasLoadFailed };
}
