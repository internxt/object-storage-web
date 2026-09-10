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

async function logIn(email: string, password: string): Promise<void> {
  const response = await axios.post<{ token: string }>(
    `${import.meta.env.VITE_OBJECT_STORAGE_API_URL}/wholesalers/login`,
    { email, password },
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

interface WholesalerTokenPayload {
  role: 'wholesaler';
  wholesalerId: string;
  email: string;
}

function getPayload(): WholesalerTokenPayload | null {
  const token = getToken();
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

export const wholesalersAuthService = {
  logIn,
  logOut,
  getToken,
  getAuthHeaders,
  getPayload,
};
