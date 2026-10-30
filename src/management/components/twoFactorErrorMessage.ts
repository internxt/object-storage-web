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
