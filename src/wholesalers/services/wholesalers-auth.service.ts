import wholesalersAxios from '../core/wholesalers-axios';

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

async function logIn(email: string, password: string, code?: string): Promise<{ twoFactorSetupRequired: boolean }> {
  const response = await wholesalersAxios.post<{ token: string; twoFactorSetupRequired?: boolean }>(
    '/wholesalers/login',
    { email, password, code },
  );
  setToken(response.data.token);
  return { twoFactorSetupRequired: !!response.data.twoFactorSetupRequired };
}

function logOut(): void {
  removeToken();
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
  getPayload,
};
