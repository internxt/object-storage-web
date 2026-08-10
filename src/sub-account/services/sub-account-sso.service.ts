import axios from 'axios';
import { BrowserAuthError, PublicClientApplication } from '@azure/msal-browser';
import subAccountAxios from '../core/sub-account-axios';
import userAxios from '../../core/config/axios';
import { PaginatedResponse } from '../../types/paginatedResponse';

export const SSO_ERROR_CODES = {
  SSO_NOT_CONFIGURED: 'SSO_NOT_CONFIGURED',
  SSO_REQUIRED: 'SSO_REQUIRED',
  MEMBER_NOT_FOUND: 'MEMBER_NOT_FOUND',
  SSO_HAS_MEMBERS: 'SSO_HAS_MEMBERS',
  SSO_ALREADY_CONFIGURED: 'SSO_ALREADY_CONFIGURED',
  ORGANIZATION_NAME_TAKEN: 'ORGANIZATION_NAME_TAKEN',
  INVALID_ID_TOKEN: 'INVALID_ID_TOKEN',
} as const;

export interface PublicSsoConfig {
  organizationName: string;
  provider: 'azure-ad';
  tenantId: string;
  clientId: string;
}

export type SsoConfig =
  { configured: false }
  | {
      configured: true;
      organizationName: string;
      provider: 'azure-ad';
      tenantId: string;
      clientId: string;
      configuredAt: string;
      token?: string;
    };

export class SsoNotConfiguredError extends Error {
  constructor() {
    super('SSO is not configured for this organization');
  }
}

export class SsoPopupBlockedError extends Error {
  constructor() {
    super('The sign-in popup was blocked by the browser');
  }
}

export class SsoCancelledError extends Error {
  constructor() {
    super('The user cancelled the sign-in');
  }
}

export class SsoTimeoutError extends Error {
  constructor() {
    super('The Microsoft sign-in did not complete in time');
  }
}

export class SsoMemberNotFoundError extends Error {
  constructor(public readonly azureEmail: string) {
    super('The Microsoft account is not a member of this organization');
  }
}

export function getSsoErrorCode(error: unknown): string | undefined {
  if (axios.isAxiosError(error)) {
    return (error.response?.data as { code?: string } | undefined)?.code;
  }
  return undefined;
}

function normalizeOrganizationName(organizationName: string): string {
  return organizationName.trim().toLowerCase();
}

async function getPublicConfig(organizationName: string): Promise<PublicSsoConfig> {
  try {
    const response = await axios.get<PublicSsoConfig>(
      `${import.meta.env.VITE_OBJECT_STORAGE_API_URL}/subaccount/sso/config`,
      { params: { organization: normalizeOrganizationName(organizationName) } },
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      throw new SsoNotConfiguredError();
    }
    throw error;
  }
}

async function acquireAzureIdToken(config: PublicSsoConfig): Promise<{ idToken: string; azureEmail: string }> {
  const msalInstance = new PublicClientApplication({
    auth: {
      clientId: config.clientId,
      authority: `https://login.microsoftonline.com/${config.tenantId}`,
      redirectUri: `${window.location.origin}/subaccount/login`,
    },
    cache: { cacheLocation: 'sessionStorage' },
    // Default is 60s, which users completing MFA can exceed.
    system: { popupBridgeTimeout: 180000 },
  });
  await msalInstance.initialize();

  try {
    const result = await msalInstance.loginPopup({
      scopes: ['openid', 'profile', 'email'],
      prompt: 'select_account',
    });
    return { idToken: result.idToken, azureEmail: result.account?.username ?? '' };
  } catch (error) {
    if (error instanceof BrowserAuthError) {
      if (error.errorCode === 'popup_window_error' || error.errorCode === 'empty_window_error') {
        throw new SsoPopupBlockedError();
      }
      if (error.errorCode === 'user_cancelled') {
        throw new SsoCancelledError();
      }
      if (error.errorCode === 'monitor_window_timeout') {
        throw new SsoTimeoutError();
      }
    }
    throw error;
  }
}

let ssoLoginInFlight = false;
async function loginWithAzure(organizationName: string): Promise<{ token: string; azureEmail: string }> {
  if (ssoLoginInFlight) throw new SsoCancelledError();
  ssoLoginInFlight = true;
  try {
    const normalizedOrg = normalizeOrganizationName(organizationName);
    const config = await getPublicConfig(normalizedOrg);
    const { idToken, azureEmail } = await acquireAzureIdToken(config);

    try {
      const response = await axios.post<{ token: string }>(
        `${import.meta.env.VITE_OBJECT_STORAGE_API_URL}/subaccount/sso/login`,
        { organizationName: normalizedOrg, idToken },
      );
      return { token: response.data.token, azureEmail };
    } catch (error) {
      const code = getSsoErrorCode(error);
      if (code === SSO_ERROR_CODES.MEMBER_NOT_FOUND) throw new SsoMemberNotFoundError(azureEmail);
      if (code === SSO_ERROR_CODES.SSO_NOT_CONFIGURED) throw new SsoNotConfiguredError();
      throw error;
    }
  } finally {
    ssoLoginInFlight = false;
  }
}

async function getSsoConfig(entityId: string): Promise<SsoConfig> {
  const response = await subAccountAxios.get<SsoConfig>(`/sub-accounts/${entityId}/sso`);
  return response.data;
}

async function configureSso(
  entityId: string,
  config: { organizationName: string; tenantId: string; clientId: string },
): Promise<SsoConfig> {
  const response = await subAccountAxios.post<SsoConfig>(`/sub-accounts/${entityId}/sso`, {
    organizationName: normalizeOrganizationName(config.organizationName),
    provider: 'azure-ad',
    tenantId: config.tenantId.trim(),
    clientId: config.clientId.trim(),
  });
  return response.data;
}

async function disableSso(entityId: string): Promise<{ token?: string }> {
  const response = await subAccountAxios.delete<{ token?: string }>(`/sub-accounts/${entityId}/sso`);
  return response.data ?? {};
}

async function getOtherMemberCount(entityId: string, currentMemberId: string): Promise<number> {
  const response = await subAccountAxios.get<{ id: string }[]>(`/sub-accounts/${entityId}/members`);
  return response.data.filter((m) => m.id !== currentMemberId).length;
}

export const subAccountSsoService = {
  getPublicConfig,
  loginWithAzure,
  getSsoConfig,
  configureSso,
  disableSso,
  getOtherMemberCount,
};

/** Root/users console variant — same contract under /users. */
async function getUserSsoConfig(): Promise<SsoConfig> {
  const response = await userAxios.get<SsoConfig>('/users/sso');
  return response.data;
}

async function configureUserSso(
  config: { organizationName: string; tenantId: string; clientId: string },
): Promise<SsoConfig> {
  const response = await userAxios.post<SsoConfig>('/users/sso', {
    organizationName: normalizeOrganizationName(config.organizationName),
    provider: 'azure-ad',
    tenantId: config.tenantId.trim(),
    clientId: config.clientId.trim(),
  });
  return response.data;
}

async function disableUserSso(): Promise<{ token?: string }> {
  const response = await userAxios.delete<{ token?: string }>('/users/sso');
  return response.data ?? {};
}

async function getOtherUserMemberCount(currentEmail: string): Promise<number> {
  const response = await userAxios.get<PaginatedResponse<{ email: string }>>('/users/members');
  return response.data.items.filter((m) => m.email !== currentEmail).length;
}

export const userSsoService = {
  getSsoConfig: getUserSsoConfig,
  configureSso: configureUserSso,
  disableSso: disableUserSso,
  getOtherMemberCount: getOtherUserMemberCount,
};
