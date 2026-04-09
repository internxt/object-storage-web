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

async function logIn(email: string, password: string): Promise<void> {
  const response = await axios.post<{ token: string }>(
    `${import.meta.env.VITE_OBJECT_STORAGE_API_URL}/partners/login`,
    { email, password }
  );
  setToken(response.data.token);
}

function logOut(): void {
  removeToken();
}

function getAuthHeaders() {
  const token = getToken();
  return { Authorization: `Bearer ${token}` };
}

export const partnersAuthService = {
  logIn,
  logOut,
  getToken,
  setToken,
  getAuthHeaders,
};
