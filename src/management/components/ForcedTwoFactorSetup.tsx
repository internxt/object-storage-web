import { ShieldWarningIcon } from '@phosphor-icons/react';
import { TwoFactorSetupForm } from '../../components/two-factor/TwoFactorSetupForm';
import { useManagement } from '../context/useManagement';
import { managementTwoFactorService } from '../services/management-two-factor.service';
import { twoFactorErrorMessage } from './twoFactorErrorMessage';
import { T, text, card } from '../../sub-account/tokens';

export const ForcedTwoFactorSetup = () => {
  const { clearTwoFactorSetupRequired, logOut } = useManagement();

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: T.gray5,
        padding: 24,
      }}
    >
      <div style={{ ...card, borderRadius: 16, padding: 32, width: '100%', maxWidth: 440 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(239,68,68,0.1)',
                color: T.red,
              }}
            >
              <ShieldWarningIcon size={20} weight="fill" />
            </div>
            <p style={{ ...text.heading, margin: 0 }}>Set up two-factor authentication</p>
            <p style={{ fontSize: 13, color: T.gray60, margin: 0 }}>
              The account owner reset two-factor authentication on this account. You must set it up again before you
              can continue.
            </p>
          </div>

          {/* enable() stores the token from the response; the server clears the flag at the same time. */}
          <TwoFactorSetupForm
            labels={{
              scanInstructions: 'Scan this QR code with your authenticator app, then enter the 6-digit code it shows.',
              qrCodeAlt: 'Two-factor authentication QR code',
              manualEntry: "Can't scan it? Enter this key manually:",
              codeLabel: 'Verification code',
              codePlaceholder: '000000',
              loading: 'Loading…',
              loadFailed: "Couldn't start the setup. Please try again.",
              cancel: 'Log out',
              confirm: 'Confirm',
            }}
            getSetup={managementTwoFactorService.getSetup}
            enable={managementTwoFactorService.enable}
            errorMessage={twoFactorErrorMessage}
            onComplete={clearTwoFactorSetupRequired}
            onCancel={logOut}
          />
        </div>
      </div>
    </div>
  );
};
