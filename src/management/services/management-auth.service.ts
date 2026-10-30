import managementAxios from '../core/management-axios';

const MANAGEMENT_TOKEN_KEY = 'managementToken';

function getToken(): string | null {
  return localStorage.getItem(MANAGEMENT_TOKEN_KEY);
}

function setToken(token: string): void {
  localStorage.setItem(MANAGEMENT_TOKEN_KEY, token);
}

function removeToken(): void {
  localStorage.removeItem(MANAGEMENT_TOKEN_KEY);
}

async function logIn(email: string, password: string, code?: string): Promise<void> {
  const response = await managementAxios.post<{ token: string }>('/management/login', { email, password, code });
  setToken(response.data.token);
}

async function reauthenticate(password: string, code?: string): Promise<void> {
  const response = await managementAxios.post<{ token: string }>('/management/me/reauthenticate', {
    password,
    code: code || undefined,
  });
  setToken(response.data.token);
}

function logOut(): void {
  removeToken();
}

export const managementAuthService = {
  logIn,
  reauthenticate,
  logOut,
  getToken,
  setToken,
};
