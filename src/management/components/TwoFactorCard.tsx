import { useEffect, useState } from 'react';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { TwoFactorSetupForm } from '../../components/two-factor/TwoFactorSetupForm';
import { TwoFactorCodeInput, TWO_FACTOR_CODE_LENGTH } from '../../components/two-factor/TwoFactorCodeInput';
import notificationsService from '../../services/notifications.service';
import { apiErrorCode } from '../../utils/apiError';
import { managementTwoFactorService, TwoFactorStatus } from '../services/management-two-factor.service';
import { SectionCard } from '../../sub-account/components/SettingsAtoms';
import { T, text, form } from '../../sub-account/tokens';

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_PASSWORD: 'Incorrect password.',
  TWO_FACTOR_INVALID_CODE: 'Invalid code. Check your authenticator app and try again.',
  TWO_FACTOR_NO_PENDING_SETUP: 'The setup expired. Close this window and start again.',
  TWO_FACTOR_ALREADY_ENABLED: 'Two-factor authentication is already enabled.',
  TWO_FACTOR_NOT_ENABLED: 'Two-factor authentication is not enabled.',
};

const errorMessage = (err: unknown): string =>
  ERROR_MESSAGES[apiErrorCode(err) ?? ''] ?? 'Something went wrong. Please try again.';

type CardState =
  { kind: 'loading' } | { kind: 'failed' } | { kind: 'legacy' } | { kind: 'ready'; status: TwoFactorStatus };

export const TwoFactorCard = () => {
  const [state, setState] = useState<CardState>({ kind: 'loading' });

  const [isSetupOpen, setIsSetupOpen] = useState(false);

  const [isDisableOpen, setIsDisableOpen] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [disableError, setDisableError] = useState<string>();
  const [isDisabling, setIsDisabling] = useState(false);

  useEffect(() => {
    managementTwoFactorService
      .getStatus()
      .then((status) => setState({ kind: 'ready', status }))
      .catch((err) => setState({ kind: apiErrorCode(err) === 'LEGACY_ADMIN' ? 'legacy' : 'failed' }));
  }, []);

  const closeDisable = () => {
    setIsDisableOpen(false);
    setDisablePassword('');
    setDisableCode('');
    setDisableError(undefined);
  };

  const handleEnabled = () => {
    setIsSetupOpen(false);
    setState({ kind: 'ready', status: { enabled: true } });
    notificationsService.success({ text: 'Two-factor authentication enabled' });
  };

  const handleDisable = async () => {
    setIsDisabling(true);
    setDisableError(undefined);
    try {
      await managementTwoFactorService.disable(disablePassword, disableCode);
      closeDisable();
      setState({ kind: 'ready', status: { enabled: false } });
      notificationsService.success({ text: 'Two-factor authentication disabled' });
    } catch (err) {
      setDisableError(errorMessage(err));
    } finally {
      setIsDisabling(false);
    }
  };

  const renderBody = () => {
    switch (state.kind) {
      case 'loading':
        return <p style={{ fontSize: 13, color: T.gray50, margin: 0 }}>Loading…</p>;
      case 'failed':
        return <p style={{ fontSize: 13, color: T.red, margin: 0 }}>Couldn't load your two-factor status.</p>;
      case 'legacy':
        return (
          <p style={{ fontSize: 13, color: T.gray60, margin: 0 }}>
            You're signed in with the shared admin credentials. Two-factor authentication needs a personal management
            account.
          </p>
        );
      case 'ready':
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
            <p style={{ fontSize: 13, color: T.gray60, margin: 0 }}>
              {state.status.enabled
                ? 'You need a code from your authenticator app each time you sign in.'
                : 'Add an extra layer of security by requiring a code from an authenticator app when you sign in.'}
            </p>
            {state.status.enabled ? (
              <Button variant="secondary" onClick={() => setIsDisableOpen(true)}>
                Disable
              </Button>
            ) : (
              <Button onClick={() => setIsSetupOpen(true)}>Enable</Button>
            )}
          </div>
        );
    }
  };

  return (
    <SectionCard
      title="Two-factor authentication"
      action={
        state.kind === 'ready' && state.status.enabled ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green/[0.12] text-green">
            <span className="w-1.5 h-1.5 rounded-full bg-green shrink-0" />
            Enabled
          </span>
        ) : undefined
      }
    >
      {renderBody()}

      <Modal isOpen={isSetupOpen} onClose={() => setIsSetupOpen(false)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 4 }}>
          <p style={{ ...text.heading, margin: 0 }}>Set up two-factor authentication</p>
          {isSetupOpen && (
            <TwoFactorSetupForm
              labels={{
                scanInstructions:
                  'Scan this QR code with your authenticator app, then enter the 6-digit code it shows.',
                qrCodeAlt: 'Two-factor authentication QR code',
                manualEntry: "Can't scan it? Enter this key manually:",
                codeLabel: 'Verification code',
                codePlaceholder: '000000',
                loading: 'Loading…',
                loadFailed: "Couldn't start the setup. Please try again.",
                cancel: 'Cancel',
                confirm: 'Confirm',
              }}
              getSetup={managementTwoFactorService.getSetup}
              enable={managementTwoFactorService.enable}
              errorMessage={errorMessage}
              onComplete={handleEnabled}
              onCancel={() => setIsSetupOpen(false)}
            />
          )}
        </div>
      </Modal>

      <Modal isOpen={isDisableOpen} onClose={closeDisable}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 4 }}>
          <p style={{ ...text.heading, margin: 0 }}>Disable two-factor authentication</p>
          <p style={{ ...text.hint, margin: 0 }}>Enter your password and a code from your authenticator app.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={form.label}>Password</label>
            <Input value={disablePassword} onChange={setDisablePassword} variant="password" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={form.label}>Verification code</label>
            <TwoFactorCodeInput
              value={disableCode}
              onChange={setDisableCode}
              placeholder="000000"
              error={disableError}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
            <Button variant="secondary" type="button" onClick={closeDisable} disabled={isDisabling}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isDisabling || !disablePassword || disableCode.length !== TWO_FACTOR_CODE_LENGTH}
              loading={isDisabling}
              onClick={handleDisable}
            >
              Disable
            </Button>
          </div>
        </div>
      </Modal>
    </SectionCard>
  );
};
