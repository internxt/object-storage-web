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

async function logIn(email: string, password: string): Promise<void> {
  const response = await managementAxios.post<{ token: string }>('/management/login', { email, password });
  setToken(response.data.token);
}

function logOut(): void {
  removeToken();
}

export const managementAuthService = {
  logIn,
  logOut,
  getToken,
};
