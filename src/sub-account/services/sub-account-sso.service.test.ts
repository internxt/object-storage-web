import { beforeEach, describe, expect, test, vi } from 'vitest';
import subAccountAxios from '../core/sub-account-axios';
import userAxios from '../../core/config/axios';
import { mockAdapter } from '../../testing/mock-axios-adapter';
import { stubLocation } from '../../testing/stub-location';

const { initializeMock, loginPopupMock } = vi.hoisted(() => ({
  initializeMock: vi.fn(),
  loginPopupMock: vi.fn(),
}));

vi.mock('@azure/msal-browser', () => {
  class BrowserAuthError extends Error {
    errorCode: string;
    constructor(errorCode: string) {
      super(errorCode);
      this.errorCode = errorCode;
    }
  }
  return {
    BrowserAuthError,
    PublicClientApplication: vi.fn().mockImplementation(function () {
      return { initialize: initializeMock, loginPopup: loginPopupMock };
    }),
  };
});

import { BrowserAuthError } from '@azure/msal-browser';
import {
  SsoCancelledError,
  SsoMemberNotFoundError,
  SsoNotConfiguredError,
  SsoPopupBlockedError,
  SsoTimeoutError,
  getSsoErrorCode,
  subAccountSsoService,
  userSsoService,
} from './sub-account-sso.service';

const PUBLIC_CONFIG = {
  organizationName: 'acme',
  provider: 'azure-ad' as const,
  tenantId: 'tenant-1',
  clientId: 'client-1',
};

describe('getSsoErrorCode', () => {
  test('when an axios error carries a backend error code, then getSsoErrorCode extracts it', async () => {
    subAccountAxios.defaults.adapter = mockAdapter(() => ({ status: 404, data: { code: 'SOME_CODE' } }));
    const error = await subAccountAxios.get('/anything').catch((e) => e);

    expect(getSsoErrorCode(error)).toBe('SOME_CODE');
  });

  test('when the error is not an axios error, then getSsoErrorCode returns undefined', () => {
    expect(getSsoErrorCode(new Error('boom'))).toBeUndefined();
  });
});

describe('getPublicConfig', () => {
  stubLocation('/subaccount/login');

  test('when getPublicConfig is called, then it fetches the config for the normalized organization name', async () => {
    let seenConfig: { url?: string; params?: Record<string, unknown> } | undefined;
    subAccountAxios.defaults.adapter = mockAdapter((config) => {
      seenConfig = config;
      return { status: 200, data: PUBLIC_CONFIG };
    });

    const result = await subAccountSsoService.getPublicConfig('  ACME  ');

    expect(seenConfig?.url).toBe('/subaccount/sso/config');
    expect(seenConfig?.params).toEqual({ organization: 'acme' });
    expect(result).toEqual(PUBLIC_CONFIG);
  });

  test('when the backend returns a 404, then getPublicConfig maps that into SsoNotConfiguredError', async () => {
    subAccountAxios.defaults.adapter = mockAdapter(() => ({ status: 404 }));

    await expect(subAccountSsoService.getPublicConfig('acme')).rejects.toBeInstanceOf(SsoNotConfiguredError);
  });

  test('when the backend rejects for any other reason, then getPublicConfig rethrows the error untouched', async () => {
    subAccountAxios.defaults.adapter = mockAdapter(() => ({ status: 500 }));

    await expect(subAccountSsoService.getPublicConfig('acme')).rejects.toMatchObject({ isAxiosError: true });
  });
});

describe('getConfigByHostname', () => {
  stubLocation('/subaccount/login');

  test('when getConfigByHostname is called, then it fetches the config for the normalized hostname', async () => {
    let seenConfig: { url?: string; params?: Record<string, unknown> } | undefined;
    subAccountAxios.defaults.adapter = mockAdapter((config) => {
      seenConfig = config;
      return { status: 200, data: PUBLIC_CONFIG };
    });

    const result = await subAccountSsoService.getConfigByHostname('  ACME.Example.com  ');

    expect(seenConfig?.url).toBe('/subaccount/sso/config');
    expect(seenConfig?.params).toEqual({ hostname: 'acme.example.com' });
    expect(result).toEqual(PUBLIC_CONFIG);
  });

  test('when the backend returns a 404, then getConfigByHostname maps that into SsoNotConfiguredError', async () => {
    subAccountAxios.defaults.adapter = mockAdapter(() => ({ status: 404 }));

    await expect(subAccountSsoService.getConfigByHostname('acme.example.com')).rejects.toBeInstanceOf(
      SsoNotConfiguredError,
    );
  });
});

describe('sub-account scoped CRUD', () => {
  stubLocation('/subaccount/login');

  test('when getSsoConfig is called, then it fetches the entity SSO config', async () => {
    let seenConfig: { url?: string } | undefined;
    subAccountAxios.defaults.adapter = mockAdapter((config) => {
      seenConfig = config;
      return { status: 200, data: { configured: false } };
    });

    const result = await subAccountSsoService.getSsoConfig('entity-1');

    expect(seenConfig?.url).toBe('/sub-accounts/entity-1/sso');
    expect(result).toEqual({ configured: false });
  });

  test('when configureSso is called, then it normalizes the organization name and trims the IDs', async () => {
    let seenConfig: { url?: string; data?: string } | undefined;
    subAccountAxios.defaults.adapter = mockAdapter((config) => {
      seenConfig = config;
      return { status: 200, data: { configured: true, ...PUBLIC_CONFIG, configuredAt: '2024-01-01' } };
    });

    await subAccountSsoService.configureSso('entity-1', {
      organizationName: '  ACME  ',
      tenantId: '  tenant-1  ',
      clientId: '  client-1  ',
    });

    expect(seenConfig?.url).toBe('/sub-accounts/entity-1/sso');
    expect(JSON.parse(seenConfig?.data ?? '{}')).toEqual({
      organizationName: 'acme',
      provider: 'azure-ad',
      tenantId: 'tenant-1',
      clientId: 'client-1',
    });
  });

  test('when the backend returns no body, then disableSso falls back to an empty object', async () => {
    subAccountAxios.defaults.adapter = mockAdapter(() => ({ status: 200, data: undefined }));

    const result = await subAccountSsoService.disableSso('entity-1');

    expect(result).toEqual({});
  });

  test('when getOtherMemberCount is called, then it excludes the current member from the count', async () => {
    subAccountAxios.defaults.adapter = mockAdapter(() => ({
      status: 200,
      data: [{ id: 'm1' }, { id: 'm2' }, { id: 'm3' }],
    }));

    const result = await subAccountSsoService.getOtherMemberCount('entity-1', 'm2');

    expect(result).toBe(2);
  });
});

describe('root/users scoped CRUD', () => {
  stubLocation('/login');

  test('when getUserSsoConfig is called, then it fetches the user-level SSO config', async () => {
    let seenConfig: { url?: string } | undefined;
    userAxios.defaults.adapter = mockAdapter((config) => {
      seenConfig = config;
      return { status: 200, data: { configured: false } };
    });

    const result = await userSsoService.getSsoConfig();

    expect(seenConfig?.url).toBe('/users/sso');
    expect(result).toEqual({ configured: false });
  });

  test('when configureUserSso is called, then it normalizes the organization name and trims the IDs', async () => {
    let seenConfig: { url?: string; data?: string } | undefined;
    userAxios.defaults.adapter = mockAdapter((config) => {
      seenConfig = config;
      return { status: 200, data: { configured: true, ...PUBLIC_CONFIG, configuredAt: '2024-01-01' } };
    });

    await userSsoService.configureSso({ organizationName: '  ACME  ', tenantId: ' t1 ', clientId: ' c1 ' });

    expect(seenConfig?.url).toBe('/users/sso');
    expect(JSON.parse(seenConfig?.data ?? '{}')).toEqual({
      organizationName: 'acme',
      provider: 'azure-ad',
      tenantId: 't1',
      clientId: 'c1',
    });
  });

  test('when the backend returns no body, then disableUserSso falls back to an empty object', async () => {
    userAxios.defaults.adapter = mockAdapter(() => ({ status: 200, data: undefined }));

    const result = await userSsoService.disableSso();

    expect(result).toEqual({});
  });

  test('when getOtherMemberCount is called, then it excludes the current email from the count', async () => {
    userAxios.defaults.adapter = mockAdapter(() => ({
      status: 200,
      data: { items: [{ email: 'a@x.com' }, { email: 'b@x.com' }] },
    }));

    const result = await userSsoService.getOtherMemberCount('a@x.com');

    expect(result).toBe(1);
  });
});

describe('loginWithAzure', () => {
  stubLocation('/subaccount/login');

  beforeEach(() => {
    initializeMock.mockReset().mockResolvedValue(undefined);
    loginPopupMock.mockReset();
    subAccountSsoService.resetSsoLoginState();
    subAccountAxios.defaults.adapter = mockAdapter((config) => {
      if (config.url === '/subaccount/sso/config') {
        return { status: 200, data: PUBLIC_CONFIG };
      }
      return { status: 200, data: { token: 'sso-jwt' } };
    });
  });

  test('when loginWithAzure succeeds, then it acquires an Azure id token via the popup and exchanges it for a backend token', async () => {
    loginPopupMock.mockResolvedValue({ idToken: 'azure-id-token', account: { username: 'member@azure.com' } });

    const result = await subAccountSsoService.loginWithAzure('acme');

    expect(result).toEqual({ token: 'sso-jwt', azureEmail: 'member@azure.com' });
  });

  test('when loginWithAzure succeeds, then it sends the normalized organization name and the acquired id token to the backend', async () => {
    loginPopupMock.mockResolvedValue({ idToken: 'azure-id-token', account: { username: 'member@azure.com' } });
    let seenLoginBody: string | undefined;
    subAccountAxios.defaults.adapter = mockAdapter((config) => {
      if (config.url === '/subaccount/sso/config') return { status: 200, data: PUBLIC_CONFIG };
      seenLoginBody = config.data as string;
      return { status: 200, data: { token: 'sso-jwt' } };
    });

    await subAccountSsoService.loginWithAzure('  ACME  ');

    expect(JSON.parse(seenLoginBody ?? '{}')).toEqual({ organizationName: 'acme', idToken: 'azure-id-token' });
  });

  test('when the Azure popup is blocked or empty, then loginWithAzure maps that into SsoPopupBlockedError', async () => {
    loginPopupMock.mockRejectedValue(new BrowserAuthError('popup_window_error', 'popup_window_error'));

    await expect(subAccountSsoService.loginWithAzure('acme')).rejects.toBeInstanceOf(SsoPopupBlockedError);
  });

  test('when the user cancels the Azure popup, then loginWithAzure maps that into SsoCancelledError', async () => {
    loginPopupMock.mockRejectedValue(new BrowserAuthError('user_cancelled', 'user_cancelled'));

    await expect(subAccountSsoService.loginWithAzure('acme')).rejects.toBeInstanceOf(SsoCancelledError);
  });

  test('when the Azure popup times out, then loginWithAzure maps that into SsoTimeoutError', async () => {
    loginPopupMock.mockRejectedValue(new BrowserAuthError('monitor_window_timeout', 'monitor_window_timeout'));

    await expect(subAccountSsoService.loginWithAzure('acme')).rejects.toBeInstanceOf(SsoTimeoutError);
  });

  test('when the backend rejects with MEMBER_NOT_FOUND, then loginWithAzure maps that into SsoMemberNotFoundError', async () => {
    loginPopupMock.mockResolvedValue({ idToken: 'azure-id-token', account: { username: 'member@azure.com' } });
    subAccountAxios.defaults.adapter = mockAdapter((config) => {
      if (config.url === '/subaccount/sso/config') return { status: 200, data: PUBLIC_CONFIG };
      return { status: 403, data: { code: 'MEMBER_NOT_FOUND' } };
    });

    await expect(subAccountSsoService.loginWithAzure('acme')).rejects.toBeInstanceOf(SsoMemberNotFoundError);
  });

  test('when the backend rejects with SSO_NOT_CONFIGURED, then loginWithAzure maps that into SsoNotConfiguredError', async () => {
    loginPopupMock.mockResolvedValue({ idToken: 'azure-id-token', account: { username: 'member@azure.com' } });
    subAccountAxios.defaults.adapter = mockAdapter((config) => {
      if (config.url === '/subaccount/sso/config') return { status: 200, data: PUBLIC_CONFIG };
      return { status: 403, data: { code: 'SSO_NOT_CONFIGURED' } };
    });

    await expect(subAccountSsoService.loginWithAzure('acme')).rejects.toBeInstanceOf(SsoNotConfiguredError);
  });

  test('when a second attempt starts while the first is still in flight, then it is rejected with SsoCancelledError', async () => {
    let resolveLogin: (value: { idToken: string; account: { username: string } }) => void = () => {};
    loginPopupMock.mockImplementation(() => new Promise((resolve) => { resolveLogin = resolve; }));

    const first = subAccountSsoService.loginWithAzure('acme');
    // Wait until `first` has actually reached the popup call (and so `ssoLoginInFlight`
    // is definitely set) before racing the second call against it.
    await vi.waitFor(() => {
      if (loginPopupMock.mock.calls.length === 0) throw new Error('loginPopup not called yet');
    });

    await expect(subAccountSsoService.loginWithAzure('acme')).rejects.toBeInstanceOf(SsoCancelledError);

    resolveLogin({ idToken: 'azure-id-token', account: { username: 'member@azure.com' } });
    await expect(first).resolves.toEqual({ token: 'sso-jwt', azureEmail: 'member@azure.com' });
  });
});
