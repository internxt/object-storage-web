import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Dialog from '../Dialog';
import notificationsService from '../../services/notifications.service';
import { SectionCard, ReadField } from '../../sub-account/components/SettingsAtoms';
import { ConfigureSsoModal } from './ConfigureSsoModal';
import {
  SSO_ERROR_CODES,
  SsoConfig,
  getSsoErrorCode,
  subAccountSsoService,
} from '../../sub-account/services/sub-account-sso.service';

interface SsoSectionProps {
  entityId: string;
  memberId: string;
  onTokenReissued?: (token: string) => void;
}

export const SsoSection = ({ entityId, memberId, onTokenReissued }: SsoSectionProps) => {
  const { t } = useTranslation('subaccount');
  const [config, setConfig] = useState<SsoConfig | null>(null);
  const [otherMemberCount, setOtherMemberCount] = useState<number | null>(null);
  const [isConfigureOpen, setIsConfigureOpen] = useState(false);
  const [isDisableConfirmOpen, setIsDisableConfirmOpen] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);

  const loadData = useCallback(() => {
    subAccountSsoService.getSsoConfig(entityId)
      .then(setConfig)
      .catch(() => {
        setConfig({ configured: false });
      });
    subAccountSsoService.getOtherMemberCount(entityId, memberId)
      .then(setOtherMemberCount)
      .catch(() => setOtherMemberCount(null));
  }, [entityId, memberId]);

  useEffect(loadData, [loadData]);

  const applyReissuedToken = (token?: string) => {
    if (token) onTokenReissued?.(token);
  };

  const onConfigured = (newConfig: SsoConfig) => {
    setIsConfigureOpen(false);
    if (newConfig.configured) applyReissuedToken(newConfig.token);
    setConfig(newConfig);
    notificationsService.success({ text: t('sso.configured') });
  };

  const onDisable = async () => {
    setIsDisabling(true);
    try {
      const { token } = await subAccountSsoService.disableSso(entityId);
      applyReissuedToken(token);
      setIsDisableConfirmOpen(false);
      notificationsService.success({ text: t('sso.disabled') });
      loadData();
    } catch (err) {
      setIsDisableConfirmOpen(false);
      if (getSsoErrorCode(err) === SSO_ERROR_CODES.SSO_HAS_MEMBERS) {
        notificationsService.error({ text: t('sso.disableBlockedError') });
        loadData();
      } else {
        notificationsService.error({ text: t('sso.disableFailed') });
      }
    } finally {
      setIsDisabling(false);
    }
  };

  const configure = useCallback(
    (config: { organizationName: string; tenantId: string; clientId: string }) =>
      subAccountSsoService.configureSso(entityId, config),
    [entityId],
  );

  if (!config) return null;

  const disableBlocked = otherMemberCount === null || otherMemberCount > 0;

  return (
    <SectionCard
      title={t('sso.sectionTitle')}
      action={config.configured ? (
        <span className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green/[0.12] text-green'>
          <span className='w-1.5 h-1.5 rounded-full bg-green shrink-0' />
          {t('sso.enabledBadge')}
        </span>
      ) : undefined}
    >
      {!config.configured ? (
        <div className='flex flex-col gap-4'>
          <p className='text-sm text-gray-60'>
            {t('sso.description')}
          </p>
          <div className='flex items-center gap-4'>
            <button
              onClick={() => setIsConfigureOpen(true)}
              className='h-10 px-5 rounded-lg bg-primary hover:bg-primary-dark text-white text-sm font-medium transition-colors shrink-0'
            >
              {t('sso.startConfiguration')}
            </button>
            <p className='text-xs text-gray-50'>{t('sso.configuredHint')}</p>
          </div>
        </div>
      ) : (
        <div className='flex flex-col gap-4'>
          <ReadField label={t('sso.organizationNameLabel')} value={config.organizationName} />
          <ReadField label={t('sso.providerLabel')} value={t('sso.providerValue')} />
          <ReadField label={t('sso.tenantIdLabel')} value={config.tenantId} mono />
          <ReadField label={t('sso.clientIdLabel')} value={config.clientId} mono />
          <ReadField label={t('sso.configuredAtLabel')} value={config.configuredAt ? new Date(config.configuredAt).toLocaleDateString() : ''} />

          <div className='flex flex-col gap-2 pt-2 border-t border-gray-10'>
            <div className='flex items-center gap-4'>
              <button
                onClick={() => setIsDisableConfirmOpen(true)}
                disabled={disableBlocked}
                className='h-10 px-5 rounded-lg bg-red hover:bg-red-dark text-white text-sm font-medium transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red'
              >
                {t('sso.disableSso')}
              </button>
              {disableBlocked && (
                <p className='text-xs text-gray-50'>
                  {t('sso.disableBlockedHint')}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfigureSsoModal
        isOpen={isConfigureOpen}
        configure={configure}
        hasOtherMembers={(otherMemberCount ?? 0) > 0}
        onClose={() => setIsConfigureOpen(false)}
        onConfigured={onConfigured}
      />
      <Dialog
        isOpen={isDisableConfirmOpen}
        onClose={() => setIsDisableConfirmOpen(false)}
        onPrimaryAction={onDisable}
        onSecondaryAction={() => setIsDisableConfirmOpen(false)}
        isLoading={isDisabling}
        primaryAction={t('sso.disableSso')}
        secondaryAction={t('actions.cancel')}
        primaryActionColor='danger'
        title={t('sso.disableConfirmTitle')}
        subtitle={t('sso.disableConfirmSubtitle')}
      />
    </SectionCard>
  );
};
