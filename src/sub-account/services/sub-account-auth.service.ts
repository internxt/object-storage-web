import axios from 'axios';
import { captchaService } from '../../services/captcha.service';
import { subAccountSsoService } from './sub-account-sso.service';

const TOKEN_KEY = 'subAccountToken';
const EMAIL_KEY = 'subAccountEmail';

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function logIn(email: string, password: string): Promise<void> {
  console.log('[sub-account] logIn called', { email });
  const response = await axios.post<{ token: string }>(
    `${import.meta.env.VITE_OBJECT_STORAGE_API_URL}/subaccount/login`,
    { email, password },
  );
  console.log('[sub-account] logIn response', { status: response.status, hasToken: !!response.data.token });
  setToken(response.data.token);
  localStorage.setItem(EMAIL_KEY, email);
  console.log('[sub-account] token saved', { role: getRole(), memberId: getMemberId(), entityId: getEntityId() });
}

async function logInWithSso(organizationName: string): Promise<void> {
  const { token, azureEmail } = await subAccountSsoService.loginWithAzure(organizationName);
  setToken(token);
  localStorage.setItem(EMAIL_KEY, azureEmail);
}

async function requestPasswordReset(email: string): Promise<void> {
  const captchaHeaders = await captchaService.getHeaders('ForgotPassword');
  await axios.post(
    `${import.meta.env.VITE_OBJECT_STORAGE_API_URL}/subaccount/forgot-password`,
    { email },
    { headers: captchaHeaders },
  );
}

async function resetPassword(token: string, newPassword: string): Promise<void> {
  await axios.post(`${import.meta.env.VITE_OBJECT_STORAGE_API_URL}/subaccount/reset-password`, { token, newPassword });
}

function getEmail(): string | null {
  return localStorage.getItem(EMAIL_KEY);
}

function logOut(): void {
  removeToken();
  localStorage.removeItem(EMAIL_KEY);
}


function getRole(): 'admin' | 'standard' | null {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role ?? null;
  } catch {
    return null;
  }
}

function getMemberId(): string | null {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.memberId ?? null;
  } catch {
    return null;
  }
}

function getEntityId(): string | null {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.entityId ?? null;
  } catch {
    return null;
  }
}

function getSsoEnabled(): boolean {
  const token = getToken();
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.ssoEnabled === true;
  } catch {
    return false;
  }
}

function getPartnerId(): string | null {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.partnerId ?? null;
  } catch {
    return null;
  }
}

function getEntityCreatedAt(): string | null {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.entityCreatedAt ?? null;
  } catch {
    return null;
  }
}

export const subAccountAuthService = {
  logIn,
  logInWithSso,
  logOut,
  requestPasswordReset,
  resetPassword,
  getToken,
  setToken,
  getRole,
  getMemberId,
  getEntityId,
  getSsoEnabled,
  getPartnerId,
  getEntityCreatedAt,
  getEmail,
};
