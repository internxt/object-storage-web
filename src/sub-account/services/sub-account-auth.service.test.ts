import { afterEach, describe, expect, test, vi } from 'vitest';
import { subAccountAuthService } from './sub-account-auth.service';
import { subAccountSsoService } from './sub-account-sso.service';
import subAccountAxios from '../core/sub-account-axios';
import { mockAdapter } from '../../testing/mock-axios-adapter';
import { stubLocation } from '../../testing/stub-location';

function fakeJwt(payload: Record<string, unknown>): string {
  return `header.${btoa(JSON.stringify(payload))}.signature`;
}

describe('subAccountAuthService', () => {
  stubLocation('/subaccount/login');

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('logIn', () => {
    test('when logIn succeeds, then it posts the credentials and stores the token and email', async () => {
      let seenConfig: { url?: string; data?: string } | undefined;
      subAccountAxios.defaults.adapter = mockAdapter((config) => {
        seenConfig = config;
        return { status: 200, data: { token: 'sub-account-jwt' } };
      });

      await subAccountAuthService.logIn('member@internxt.com', 'secret');

      expect(seenConfig?.url).toBe('/subaccount/login');
      expect(JSON.parse(seenConfig?.data ?? '{}')).toEqual({ email: 'member@internxt.com', password: 'secret' });
      expect(subAccountAuthService.getToken()).toBe('sub-account-jwt');
      expect(subAccountAuthService.getEmail()).toBe('member@internxt.com');
    });

    test('when the backend rejects the credentials, then logIn rejects and stores nothing', async () => {
      subAccountAxios.defaults.adapter = mockAdapter(() => ({ status: 401 }));

      await expect(subAccountAuthService.logIn('member@internxt.com', 'wrong')).rejects.toMatchObject({
        isAxiosError: true,
      });
      expect(subAccountAuthService.getToken()).toBeNull();
      expect(subAccountAuthService.getEmail()).toBeNull();
    });
  });

  describe('logInWithSso', () => {
    test('when logInWithSso succeeds, then it delegates to subAccountSsoService and stores the returned token and Azure email', async () => {
      vi.spyOn(subAccountSsoService, 'loginWithAzure').mockResolvedValue({
        token: 'sso-jwt',
        azureEmail: 'member@azure.com',
      });

      await subAccountAuthService.logInWithSso('acme');

      expect(subAccountSsoService.loginWithAzure).toHaveBeenCalledWith('acme');
      expect(subAccountAuthService.getToken()).toBe('sso-jwt');
      expect(subAccountAuthService.getEmail()).toBe('member@azure.com');
    });

    test('when subAccountSsoService rejects, then logInWithSso propagates the rejection without storing anything', async () => {
      vi.spyOn(subAccountSsoService, 'loginWithAzure').mockRejectedValue(new Error('popup blocked'));

      await expect(subAccountAuthService.logInWithSso('acme')).rejects.toThrow('popup blocked');
      expect(subAccountAuthService.getToken()).toBeNull();
    });
  });

  describe('requestPasswordReset', () => {
    test('when requestPasswordReset is called, then it posts the email to the forgot-password endpoint', async () => {
      let seenConfig: { url?: string; data?: string } | undefined;
      subAccountAxios.defaults.adapter = mockAdapter((config) => {
        seenConfig = config;
        return { status: 200 };
      });

      await subAccountAuthService.requestPasswordReset('member@internxt.com');

      expect(seenConfig?.url).toBe('/subaccount/forgot-password');
      expect(JSON.parse(seenConfig?.data ?? '{}')).toEqual({ email: 'member@internxt.com' });
    });

    test('when the backend rejects the captcha, then requestPasswordReset maps that into a CaptchaUnavailableError', async () => {
      subAccountAxios.defaults.adapter = mockAdapter(() => ({ status: 403, data: { code: 'CAPTCHA_FAILED' } }));

      const error = await subAccountAuthService.requestPasswordReset('member@internxt.com').catch((e) => e);

      expect(error.name).toBe('CaptchaUnavailableError');
    });

    test('when the backend rejects for any other reason, then requestPasswordReset rethrows the error untouched', async () => {
      subAccountAxios.defaults.adapter = mockAdapter(() => ({ status: 500 }));

      await expect(subAccountAuthService.requestPasswordReset('member@internxt.com')).rejects.toMatchObject({
        isAxiosError: true,
      });
    });
  });

  describe('resetPassword', () => {
    test('when resetPassword is called, then it posts the reset token and the new password', async () => {
      let seenConfig: { url?: string; data?: string } | undefined;
      subAccountAxios.defaults.adapter = mockAdapter((config) => {
        seenConfig = config;
        return { status: 200 };
      });

      await subAccountAuthService.resetPassword('reset-token', 'new-secret');

      expect(seenConfig?.url).toBe('/subaccount/reset-password');
      expect(JSON.parse(seenConfig?.data ?? '{}')).toEqual({ token: 'reset-token', newPassword: 'new-secret' });
    });
  });

  describe('logOut', () => {
    test('when logOut is called, then it clears both the token and the stored email', async () => {
      subAccountAxios.defaults.adapter = mockAdapter(() => ({ status: 200, data: { token: 'sub-account-jwt' } }));
      await subAccountAuthService.logIn('member@internxt.com', 'secret');

      subAccountAuthService.logOut();

      expect(subAccountAuthService.getToken()).toBeNull();
      expect(subAccountAuthService.getEmail()).toBeNull();
    });
  });

  describe('JWT claim getters', () => {
    test('when there is no token, then all the JWT claim getters return null/false', () => {
      expect(subAccountAuthService.getRole()).toBeNull();
      expect(subAccountAuthService.getMemberId()).toBeNull();
      expect(subAccountAuthService.getEntityId()).toBeNull();
      expect(subAccountAuthService.getSsoEnabled()).toBe(false);
      expect(subAccountAuthService.getAuditLogEnabled()).toBe(false);
      expect(subAccountAuthService.getPartnerId()).toBeNull();
      expect(subAccountAuthService.getEntityCreatedAt()).toBeNull();
    });

    test('when a token is stored, then each getter decodes its respective claim from the payload', () => {
      subAccountAuthService.setToken(
        fakeJwt({
          role: 'admin',
          memberId: 'member-1',
          entityId: 'entity-1',
          ssoEnabled: true,
          auditLogEnabled: true,
          partnerId: 'partner-1',
          entityCreatedAt: '2024-01-01T00:00:00.000Z',
        }),
      );

      expect(subAccountAuthService.getRole()).toBe('admin');
      expect(subAccountAuthService.getMemberId()).toBe('member-1');
      expect(subAccountAuthService.getEntityId()).toBe('entity-1');
      expect(subAccountAuthService.getSsoEnabled()).toBe(true);
      expect(subAccountAuthService.getAuditLogEnabled()).toBe(true);
      expect(subAccountAuthService.getPartnerId()).toBe('partner-1');
      expect(subAccountAuthService.getEntityCreatedAt()).toBe('2024-01-01T00:00:00.000Z');
    });

    test('when the stored token is malformed, then all the JWT claim getters return null/false', () => {
      subAccountAuthService.setToken('not-a-jwt');

      expect(subAccountAuthService.getRole()).toBeNull();
      expect(subAccountAuthService.getMemberId()).toBeNull();
      expect(subAccountAuthService.getEntityId()).toBeNull();
      expect(subAccountAuthService.getSsoEnabled()).toBe(false);
      expect(subAccountAuthService.getAuditLogEnabled()).toBe(false);
      expect(subAccountAuthService.getPartnerId()).toBeNull();
      expect(subAccountAuthService.getEntityCreatedAt()).toBeNull();
    });
  });
});
