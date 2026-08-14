import axios from 'axios';

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

async function logIn(email: string, password: string, code?: string): Promise<void> {
  try {
    const response = await axios.post<{ token: string }>(
      `${import.meta.env.VITE_OBJECT_STORAGE_API_URL}/partners/login`,
      { email, password, code }
    );
    setToken(response.data.token);
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
  getToken,
  setToken,
  getAuthHeaders,
  getRole,
};
