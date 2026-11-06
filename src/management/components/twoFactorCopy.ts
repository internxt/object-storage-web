import type { TwoFactorSetupFormLabels } from '../../components/two-factor/TwoFactorSetupForm';
import { apiErrorCode } from '../../utils/apiError';

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_PASSWORD: 'Incorrect password.',
  TWO_FACTOR_INVALID_CODE: 'Invalid code. Check your authenticator app and try again.',
  TWO_FACTOR_NO_PENDING_SETUP: 'The setup expired. Close this window and start again.',
  TWO_FACTOR_ALREADY_ENABLED: 'Two-factor authentication is already enabled.',
  TWO_FACTOR_NOT_ENABLED: 'Two-factor authentication is not enabled.',
};

export const twoFactorErrorMessage = (err: unknown): string =>
  ERROR_MESSAGES[apiErrorCode(err) ?? ''] ?? 'Something went wrong. Please try again.';

export const TWO_FACTOR_SETUP_LABELS: TwoFactorSetupFormLabels = {
  scanInstructions: 'Scan this QR code with your authenticator app, then enter the 6-digit code it shows.',
  qrCodeAlt: 'Two-factor authentication QR code',
  manualEntry: "Can't scan it? Enter this key manually:",
  codeLabel: 'Verification code',
  codePlaceholder: '000000',
  loading: 'Loading…',
  loadFailed: "Couldn't start the setup. Please try again.",
  cancel: 'Cancel',
  confirm: 'Confirm',
};
