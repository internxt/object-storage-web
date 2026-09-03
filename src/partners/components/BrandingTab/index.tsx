import { useEffect, useState } from 'react';
import { BrandingForm } from './BrandingForm';
import { BrandingPreview } from './BrandingPreview';
import { initialState, type BrandingFormValues } from './constants';
import { brandingService } from '../../services/branding.service';
import type { Branding } from '../../services/branding.service';
import notificationsService from '../../../services/notifications.service';
import { getErrorMessage } from './service';

function toFormBranding({ logoUrl, primaryColor }: Branding) {
  return {
    logoUrl: logoUrl ?? '',
    primaryColor: primaryColor ?? '',
  };
}

export function BrandingTab() {
  const [branding, setBranding] = useState(initialState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    brandingService
      .getBranding()
      .then((branding) => setBranding(toFormBranding(branding)))
      .catch(() => notificationsService.error({ text: 'Could not load branding.' }))
      .finally(() => setLoading(false));
  }, []);

  async function save () {
    setSaving(true);
    try {
      const response = await brandingService.updateBranding({
        logoUrl: branding.logoUrl.trim() || null,
        primaryColor: branding.primaryColor.trim() || null,
      });
      setBranding(toFormBranding(response));
      notificationsService.success({ text: 'Branding saved successfully.' });
    } catch (error) {
      notificationsService.error({ text: getErrorMessage(error) });
    } finally {
      setSaving(false);
    }
  };

  function reset() {
    setBranding(initialState);
  }

  function updateBranding(changes: Partial<BrandingFormValues>) {
    setBranding((current) => ({ ...current, ...changes }));
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(280px, 0.8fr)', gap: 24, alignItems: 'start' }}>
      <BrandingForm
        branding={branding}
        loading={loading}
        saving={saving}
        onChange={updateBranding}
        onSave={save}
        onReset={reset}
      />

      <BrandingPreview logoUrl={branding.logoUrl} primaryColor={branding.primaryColor} />
    </div>
  );
};
