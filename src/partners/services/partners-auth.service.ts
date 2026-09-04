import axios from 'axios';
import { captchaService } from '../../services/captcha.service';

const PARTNERS_TOKEN_KEY = 'partnersToken';

function getToken(): string | null {
  return localStorage.getItem(PARTNERS_TOKEN_KEY);
}

function setToken(token: string): void {
  localStorage.setItem(PARTNERS_TOKEN_KEY, token);
}

function removeToken(): void {
  localStorage.removeItem(PARTNERS_TOKEN_KEY);
}

function isTwoFactorRequiredError(err: unknown): boolean {
  return (
    axios.isAxiosError(err) &&
    err.response?.status === 403 &&
    (err.response?.data as { message?: string })?.message === '2FA_REQUIRED'
  );
}

async function logIn(email: string, password: string, code?: string): Promise<{ twoFactorSetupRequired: boolean }> {
  try {
    const response = await axios.post<{ token: string; twoFactorSetupRequired: boolean }>(
      `${import.meta.env.VITE_OBJECT_STORAGE_API_URL}/partners/login`,
      { email, password, code }
    );
    setToken(response.data.token);
    return { twoFactorSetupRequired: response.data.twoFactorSetupRequired };
  } catch (err) {
    if (isTwoFactorRequiredError(err)) {
      const error = new Error('2FA_REQUIRED');
      error.name = 'TwoFactorRequiredError';
      throw error;
    }
    throw err;
  }
}

async function requestPasswordReset(email: string): Promise<void> {
  const captchaHeaders = await captchaService.getHeaders('ForgotPassword');
  await axios.post(
    `${import.meta.env.VITE_OBJECT_STORAGE_API_URL}/partners/forgot-password`,
    { email },
    { headers: captchaHeaders },
  );
}

async function resetPassword(token: string, newPassword: string): Promise<void> {
  await axios.post(`${import.meta.env.VITE_OBJECT_STORAGE_API_URL}/partners/reset-password`, { token, newPassword });
}

function logOut(): void {
  removeToken();
}

function getAuthHeaders() {
  const token = getToken();
  return { Authorization: `Bearer ${token}` };
}

function getRole(): 'partner' | 'member' | null {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role ?? null;
  } catch {
    return null;
  }
}

export const partnersAuthService = {
  logIn,
  logOut,
  requestPasswordReset,
  resetPassword,
  getToken,
  setToken,
  getAuthHeaders,
  getRole,
};
