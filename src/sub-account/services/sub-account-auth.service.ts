import axios from 'axios';

const TOKEN_KEY = 'subAccountToken';

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
  console.log('[sub-account] token saved', { role: getRole(), memberId: getMemberId(), entityId: getEntityId() });
}

function logOut(): void {
  removeToken();
}

function getAuthHeaders() {
  const token = getToken();
  return { Authorization: `Bearer ${token}` };
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

export const subAccountAuthService = {
  logIn,
  logOut,
  getToken,
  setToken,
  getAuthHeaders,
  getRole,
  getMemberId,
  getEntityId,
};
