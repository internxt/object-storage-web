import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { TwoFactorSetupForm } from '../../components/two-factor/TwoFactorSetupForm';
import { TwoFactorCodeInput, TWO_FACTOR_CODE_LENGTH } from '../../components/two-factor/TwoFactorCodeInput';
import notificationsService from '../../services/notifications.service';
import { apiErrorCode } from '../../utils/apiError';
import { useSubAccount } from '../context/useSubAccount';
import { subAccountTwoFactorService, TwoFactorStatus } from '../services/sub-account-two-factor.service';
import { SectionCard } from './SettingsAtoms';
import { text, form } from '../tokens';

const ERROR_KEYS: Record<string, string> = {
  SSO_ENABLED: 'ssoManaged',
  INVALID_PASSWORD: 'invalidPassword',
  TWO_FACTOR_INVALID_CODE: 'invalidCode',
  TWO_FACTOR_NO_PENDING_SETUP: 'setupExpired',
  TWO_FACTOR_ALREADY_ENABLED: 'alreadyEnabled',
  TWO_FACTOR_NOT_ENABLED: 'notEnabled',
};

export const TwoFactorCard = () => {
  const { t } = useTranslation('subaccount');
  const { refreshClaims } = useSubAccount();
  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [statusFailed, setStatusFailed] = useState(false);

  const [isSetupOpen, setIsSetupOpen] = useState(false);

  const [isDisableOpen, setIsDisableOpen] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [disableError, setDisableError] = useState<string>();
  const [isDisabling, setIsDisabling] = useState(false);

  useEffect(() => {
    subAccountTwoFactorService
      .getStatus()
      .then(setStatus)
      .catch(() => setStatusFailed(true));
  }, []);

  const errorMessage = (err: unknown): string => {
    const key = ERROR_KEYS[apiErrorCode(err) ?? ''] ?? 'genericError';
    return t(`settings.profile.twoFactor.${key}`);
  };

  const closeDisable = () => {
    setIsDisableOpen(false);
    setDisablePassword('');
    setDisableCode('');
    setDisableError(undefined);
  };

  const handleEnabled = () => {
    setIsSetupOpen(false);
    setStatus((prev) => prev && { ...prev, enabled: true });
    refreshClaims();
    notificationsService.success({ text: t('settings.profile.twoFactor.enabledToast') });
  };

  const handleDisable = async () => {
    setIsDisabling(true);
    setDisableError(undefined);
    try {
      await subAccountTwoFactorService.disable(disablePassword, disableCode);
      closeDisable();
      setStatus((prev) => prev && { ...prev, enabled: false });
      refreshClaims();
      notificationsService.success({ text: t('settings.profile.twoFactor.disabledToast') });
    } catch (err) {
      setDisableError(errorMessage(err));
    } finally {
      setIsDisabling(false);
    }
  };

  const renderBody = () => {
    if (statusFailed) return <p className="text-sm text-red">{t('settings.profile.twoFactor.loadFailed')}</p>;
    if (!status) return <p className="text-sm text-gray-50">{t('settings.profile.twoFactor.loading')}</p>;
    if (status.ssoEnabled) return <p className="text-sm text-gray-60">{t('settings.profile.twoFactor.ssoManaged')}</p>;

    return (
      <div className="flex items-center justify-between gap-6">
        <p className="text-sm text-gray-60">
          {status.enabled
            ? t('settings.profile.twoFactor.enabledDescription')
            : t('settings.profile.twoFactor.description')}
        </p>
        {status.enabled ? (
          <Button variant="secondary" onClick={() => setIsDisableOpen(true)}>
            {t('settings.profile.twoFactor.disable')}
          </Button>
        ) : (
          <Button onClick={() => setIsSetupOpen(true)}>{t('settings.profile.twoFactor.enable')}</Button>
        )}
      </div>
    );
  };

  return (
    <SectionCard
      title={t('settings.profile.twoFactor.title')}
      action={
        status?.enabled && !status.ssoEnabled ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green/[0.12] text-green">
            <span className="w-1.5 h-1.5 rounded-full bg-green shrink-0" />
            {t('settings.profile.twoFactor.enabledPill')}
          </span>
        ) : undefined
      }
    >
      {renderBody()}

      <Modal isOpen={isSetupOpen} onClose={() => setIsSetupOpen(false)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 4 }}>
          <p style={{ ...text.heading, margin: 0 }}>{t('settings.profile.twoFactor.setupTitle')}</p>
          {isSetupOpen && (
            <TwoFactorSetupForm
              labels={{
                scanInstructions: t('settings.profile.twoFactor.scanInstructions'),
                qrCodeAlt: t('settings.profile.twoFactor.qrCodeAlt'),
                manualEntry: t('settings.profile.twoFactor.manualEntry'),
                codeLabel: t('settings.profile.twoFactor.codeLabel'),
                codePlaceholder: t('settings.profile.twoFactor.codePlaceholder'),
                loading: t('settings.profile.twoFactor.loading'),
                loadFailed: t('settings.profile.twoFactor.setupLoadFailed'),
                cancel: t('actions.cancel'),
                confirm: t('actions.confirm'),
              }}
              getSetup={subAccountTwoFactorService.getSetup}
              enable={subAccountTwoFactorService.enable}
              errorMessage={errorMessage}
              onComplete={handleEnabled}
              onCancel={() => setIsSetupOpen(false)}
            />
          )}
        </div>
      </Modal>

      <Modal isOpen={isDisableOpen} onClose={closeDisable}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 4 }}>
          <p style={{ ...text.heading, margin: 0 }}>{t('settings.profile.twoFactor.disableTitle')}</p>
          <p style={{ ...text.hint, margin: 0 }}>{t('settings.profile.twoFactor.disableDescription')}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={form.label}>{t('settings.profile.twoFactor.passwordLabel')}</label>
            <Input value={disablePassword} onChange={setDisablePassword} variant="password" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={form.label}>{t('settings.profile.twoFactor.codeLabel')}</label>
            <TwoFactorCodeInput
              value={disableCode}
              onChange={setDisableCode}
              placeholder={t('settings.profile.twoFactor.codePlaceholder')}
              error={disableError}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
            <Button variant="secondary" type="button" onClick={closeDisable} disabled={isDisabling}>
              {t('actions.cancel')}
            </Button>
            <Button
              type="button"
              disabled={isDisabling || !disablePassword || disableCode.length !== TWO_FACTOR_CODE_LENGTH}
              loading={isDisabling}
              onClick={handleDisable}
            >
              {t('settings.profile.twoFactor.disable')}
            </Button>
          </div>
        </div>
      </Modal>
    </SectionCard>
  );
};
