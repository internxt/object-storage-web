import axios from 'axios';

export const apiErrorMessage = (err: unknown, fallback: string): string => {
  const message = axios.isAxiosError(err) ? err.response?.data?.message : undefined;
  if (Array.isArray(message)) return message.join('. ');
  return typeof message === 'string' && message.length > 0 ? message : fallback;
};

export const hasApiErrorStatus = (err: unknown, status: number): boolean =>
  axios.isAxiosError(err) && err.response?.status === status;

export const apiErrorCode = (err: unknown): string | undefined => {
  const code = axios.isAxiosError(err) ? err.response?.data?.code : undefined;
  return typeof code === 'string' ? code : undefined;
};

export const isTwoFactorRequiredError = (err: unknown): boolean =>
  axios.isAxiosError(err) && err.response?.status === 403 && err.response?.data?.message === '2FA_REQUIRED';

export const isReauthRequiredError = (err: unknown): boolean =>
  axios.isAxiosError(err) && err.response?.status === 403 && err.response?.data?.code === 'REAUTH_REQUIRED';
