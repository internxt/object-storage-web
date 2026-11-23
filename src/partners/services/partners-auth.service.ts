import partnersAxios from '../core/partners-axios';
import { CaptchaUnavailableError, captchaService } from '../../services/captcha.service';

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

async function logIn(email: string, password: string, code?: string): Promise<{ twoFactorSetupRequired: boolean }> {
  const response = await partnersAxios.post<{ token: string; twoFactorSetupRequired: boolean }>('/partners/login', {
    email,
    password,
    code,
  });
  setToken(response.data.token);
  return { twoFactorSetupRequired: response.data.twoFactorSetupRequired };
}

async function requestPasswordReset(email: string): Promise<void> {
  const captchaHeaders = await captchaService.tryGetHeaders('ForgotPassword');

  try {
    await partnersAxios.post('/partners/forgot-password', { email }, { headers: captchaHeaders });
  } catch (err) {
    if (captchaService.isCaptchaRejection(err)) throw new CaptchaUnavailableError();
    throw err;
  }
}

async function resetPassword(token: string, newPassword: string): Promise<void> {
  await partnersAxios.post('/partners/reset-password', { token, newPassword });
}

function logOut(): void {
  removeToken();
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
  getRole,
};
