import axios from 'axios';

const WHOLESALERS_TOKEN_KEY = 'wholesalersToken';

function getToken(): string | null {
  return localStorage.getItem(WHOLESALERS_TOKEN_KEY);
}

function setToken(token: string): void {
  localStorage.setItem(WHOLESALERS_TOKEN_KEY, token);
}

function removeToken(): void {
  localStorage.removeItem(WHOLESALERS_TOKEN_KEY);
}

function isTwoFactorRequiredError(err: unknown): boolean {
  return (
    axios.isAxiosError(err) &&
    err.response?.status === 403 &&
    (err.response?.data as { message?: string })?.message === '2FA_REQUIRED'
  );
}

async function logIn(
  email: string,
  password: string,
  code?: string,
): Promise<{ twoFactorSetupRequired: boolean }> {
  try {
    const response = await axios.post<{ token: string; twoFactorSetupRequired?: boolean }>(
      `${import.meta.env.VITE_OBJECT_STORAGE_API_URL}/wholesalers/login`,
      { email, password, code },
    );
    setToken(response.data.token);
    return { twoFactorSetupRequired: !!response.data.twoFactorSetupRequired };
  } catch (err) {
    if (isTwoFactorRequiredError(err)) {
      const error = new Error('2FA_REQUIRED');
      error.name = 'TwoFactorRequiredError';
      throw error;
    }
    throw err;
  }
}

function logOut(): void {
  removeToken();
}

function getAuthHeaders() {
  const token = getToken();
  return { Authorization: `Bearer ${token}` };
}

type WholesalerTokenPayload =
  | { role: 'wholesaler'; wholesalerId: string; email: string }
  | { role: 'member'; memberId: string; entityType: 'wholesaler'; entityId: string };

function getPayload(): WholesalerTokenPayload | null {
  const token = getToken();
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

function getRole(): 'wholesaler' | 'member' | null {
  return getPayload()?.role ?? null;
}

export const wholesalersAuthService = {
  getRole,
  logIn,
  setToken,
  logOut,
  getToken,
  getAuthHeaders,
  getPayload,
};
