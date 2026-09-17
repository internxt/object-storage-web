import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { WarningCircleIcon } from '@phosphor-icons/react';
import Modal from '../Modal';
import Input from '../Input';
import Button from '../Button';
import { T, text, form } from '../../sub-account/tokens';
import {
  PublicSsoConfig,
  SsoCancelledError,
  SsoMemberNotFoundError,
  SsoNotConfiguredError,
  SsoPopupBlockedError,
  subAccountSsoService,
} from '../../sub-account/services/sub-account-sso.service';
import { isSharedConsoleHostname } from '../../sub-account/context/SubAccountBrandingContext/service';

const SSO_ORG_KEY = 'subAccountSsoOrg';

type ResolutionState =
  | { kind: 'checking' }
  | { kind: 'auto'; config: PublicSsoConfig }
  | { kind: 'manual' };

interface SsoLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  logInWithSso: (organizationName: string) => Promise<void>;
  resolvedConfig?: PublicSsoConfig;
}

export const SsoLoginModal = ({ isOpen, onClose, logInWithSso, resolvedConfig }: SsoLoginModalProps) => {
  const { t } = useTranslation('subaccount');
  const [organizationName, setOrganizationName] = useState('');
  const [resolution, setResolution] = useState<ResolutionState>({ kind: 'manual' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{ kind: 'warning' | 'error'; message: string } | null>(null);
  // Bumped every time the modal opens, so a stale response from an attempt left
  // hanging in a previous, interrupted popup can't clobber a fresh one's state.
  const attemptIdRef = useRef(0);

  useEffect(() => {
    if (!isOpen) return;
    attemptIdRef.current += 1;
    const attemptId = attemptIdRef.current;
    setError(null);
    setIsLoading(false);
    // Start every attempt from a clean slate, even if the previous one was
    // interrupted mid-popup and left MSAL's client-side state stuck.
    subAccountSsoService.resetSsoLoginState();

    const startManual = () => {
      setOrganizationName(localStorage.getItem(SSO_ORG_KEY) ?? '');
      setResolution({ kind: 'manual' });
    };

    // The caller already resolved the config for this hostname (e.g. the login
    // page's own by-hostname check) — reuse it instead of looking it up again.
    if (resolvedConfig) {
      setResolution({ kind: 'auto', config: resolvedConfig });
      return;
    }

    // The shared console hostname has no custom-domain SSO association, so never
    // attempt the hostname lookup there — go straight to the manual flow.
    if (isSharedConsoleHostname()) {
      startManual();
      return;
    }

    setResolution({ kind: 'checking' });
    subAccountSsoService
      .getConfigByHostname(window.location.hostname)
      .then((config) => {
        if (attemptId !== attemptIdRef.current) return;
        setResolution({ kind: 'auto', config });
      })
      .catch(() => {
        // No custom-domain SSO for this hostname (404) or a network hiccup —
        // either way, degrade silently to the manual organization-name field.
        if (attemptId !== attemptIdRef.current) return;
        startManual();
      });
  }, [isOpen, resolvedConfig]);

  const canSubmit = resolution.kind === 'auto' ? !isLoading : !!organizationName.trim() && !isLoading;

  const handleCancel = () => {
    // Invalidate the in-flight attempt (if any) so its eventual response is
    // ignored, and close right away, we can't abort loginPopup() itself, but
    // the user shouldn't have to wait for it to settle to leave the modal.
    attemptIdRef.current += 1;
    setIsLoading(false);
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const attemptId = attemptIdRef.current;
    const orgToLogIn = resolution.kind === 'auto' ? resolution.config.organizationName : organizationName;
    setError(null);
    setIsLoading(true);
    try {
      await logInWithSso(orgToLogIn);
      if (attemptId !== attemptIdRef.current) return;
      if (resolution.kind !== 'auto') localStorage.setItem(SSO_ORG_KEY, orgToLogIn.trim().toLowerCase());
      onClose();
    } catch (err) {
      if (attemptId !== attemptIdRef.current) return;
      if (err instanceof SsoNotConfiguredError) {
        setError({
          kind: 'warning',
          message: t('sso.loginModal.notConfiguredError'),
        });
      } else if (err instanceof SsoMemberNotFoundError) {
        setError({
          kind: 'error',
          message: t('sso.loginModal.memberNotFoundError', { email: err.azureEmail || t('sso.loginModal.usedFallback') }),
        });
      } else if (err instanceof SsoPopupBlockedError) {
        setError({
          kind: 'error',
          message: t('sso.loginModal.popupBlockedError'),
        });
      } else if (err instanceof SsoCancelledError) {
        setError({
          kind: 'error',
          message: t('sso.loginModal.cancelledError'),
        });
      } else {
        setError({ kind: 'error', message: t('sso.loginModal.genericError') });
      }
    } finally {
      if (attemptId === attemptIdRef.current) setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 4 }}>
        <div>
          <p style={{ ...text.heading, margin: 0 }}>{t('sso.loginModal.title')}</p>
          <p style={{ ...text.hint, margin: '6px 0 0' }}>
            {resolution.kind === 'auto' &&
              t('sso.loginModal.autoDescription', { hostname: window.location.hostname })}
            {resolution.kind === 'checking' && t('sso.loginModal.checkingDescription')}
            {resolution.kind === 'manual' && t('sso.loginModal.manualDescription')}
          </p>
        </div>

        {resolution.kind === 'manual' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={form.label}>{t('sso.organizationNameLabel')}</label>
            <Input value={organizationName} onChange={setOrganizationName} placeholder={t('sso.loginModal.organizationNamePlaceholder')} autofocus />
          </div>
        )}

        {error && (
          <div
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', borderRadius: 8,
              background: error.kind === 'warning' ? '#FFF7E6' : '#FDECEC',
              color: error.kind === 'warning' ? '#8A5A00' : T.red,
            }}
          >
            <WarningCircleIcon size={18} weight='fill' style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: 13, lineHeight: 1.45 }}>{error.message}</span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
          <Button variant='secondary' type='button' onClick={handleCancel}>
            {t('actions.cancel')}
          </Button>
          <Button type='submit' disabled={!canSubmit} loading={isLoading}>
            {t('sso.loginModal.continueWithMicrosoft')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
