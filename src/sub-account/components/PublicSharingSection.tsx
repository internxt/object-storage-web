import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Dialog from '../../components/Dialog';
import { Switch } from '../../components/Switch';
import notificationsService from '../../services/notifications.service';
import { apiErrorMessage } from '../../utils/apiError';
import { subAccountSettingsService } from '../services/sub-account-settings.service';
import { SectionCard } from './SettingsAtoms';

export const PublicSharingSection = ({ entityId }: { entityId: string }) => {
  const { t } = useTranslation('subaccount');
  const [isEnabled, setIsEnabled] = useState<boolean | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmingDisable, setIsConfirmingDisable] = useState(false);

  useEffect(() => {
    subAccountSettingsService
      .getSettings(entityId)
      .then((settings) => setIsEnabled(settings.publicSharingEnabled))
      .catch(() => notificationsService.error({ text: t('settings.account.publicSharingLoadFailed') }));
  }, [entityId, t]);

  const save = async (publicSharingEnabled: boolean) => {
    setIsSaving(true);
    try {
      const settings = await subAccountSettingsService.updateSettings(entityId, { publicSharingEnabled });
      setIsEnabled(settings.publicSharingEnabled);
      setIsConfirmingDisable(false);
      notificationsService.success({
        text: t(settings.publicSharingEnabled ? 'settings.account.publicSharingEnabled' : 'settings.account.publicSharingDisabled'),
      });
    } catch (err) {
      notificationsService.error({ text: apiErrorMessage(err, t('settings.account.publicSharingUpdateFailed')) });
    } finally {
      setIsSaving(false);
    }
  };

  const onToggle = (checked: boolean) => {
    if (checked) save(true);
    else setIsConfirmingDisable(true);
  };

  return (
    <SectionCard
      title={t('settings.account.publicSharingTitle')}
      action={
        <Switch
          label={t('settings.account.publicSharingToggle')}
          checked={isEnabled ?? false}
          disabled={isEnabled === null || isSaving}
          onChange={onToggle}
        />
      }
    >
      <p className='text-sm text-gray-60'>{t('settings.account.publicSharingDescription')}</p>
      <Dialog
        isOpen={isConfirmingDisable}
        onClose={() => setIsConfirmingDisable(false)}
        onPrimaryAction={() => save(false)}
        onSecondaryAction={() => setIsConfirmingDisable(false)}
        isLoading={isSaving}
        primaryAction={t('settings.account.publicSharingDisableConfirm')}
        secondaryAction={t('actions.cancel')}
        primaryActionColor='danger'
        title={t('settings.account.publicSharingDisableTitle')}
        subtitle={t('settings.account.publicSharingDisableSubtitle')}
      />
    </SectionCard>
  );
};
