import { afterEach, describe, expect, test } from 'vitest';
import { partnersAuthService } from './partners-auth.service';
import partnersAxios from '../core/partners-axios';
import { mockAdapter } from '../../testing/mock-axios-adapter';
import { stubLocation } from '../../testing/stub-location';

function fakeJwt(payload: Record<string, unknown>): string {
  return `header.${btoa(JSON.stringify(payload))}.signature`;
}

describe('partnersAuthService', () => {
  // Every test here calls the real login/forgot-password/reset-password endpoints
  // "from" the partners login page, so the instance's own 401 interceptor (which
  // would otherwise try a real navigation jsdom doesn't support) never fires.
  stubLocation('/partners/login');

  afterEach(() => {
    localStorage.clear();
  });

  describe('logIn', () => {
    test('when logIn succeeds, then it posts the credentials and 2FA code, and stores the returned token', async () => {
      let seenConfig: { url?: string; data?: string } | undefined;
      partnersAxios.defaults.adapter = mockAdapter((config) => {
        seenConfig = config;
        return { status: 200, data: { token: 'partners-jwt', twoFactorSetupRequired: true } };
      });

      const result = await partnersAuthService.logIn('partner@internxt.com', 'secret', '123456');

      expect(seenConfig?.url).toBe('/partners/login');
      expect(JSON.parse(seenConfig?.data ?? '{}')).toEqual({
        email: 'partner@internxt.com',
        password: 'secret',
        code: '123456',
      });
      expect(partnersAuthService.getToken()).toBe('partners-jwt');
      expect(result).toEqual({ twoFactorSetupRequired: true });
    });

    test('when the backend rejects with 2FA_REQUIRED, then it maps that into a TwoFactorRequiredError without storing a token', async () => {
      partnersAxios.defaults.adapter = mockAdapter(() => ({
        status: 403,
        data: { message: '2FA_REQUIRED' },
      }));

      const error = await partnersAuthService.logIn('partner@internxt.com', 'secret').catch((e) => e);

      expect(error.name).toBe('TwoFactorRequiredError');
      expect(partnersAuthService.getToken()).toBeNull();
    });

    test('when the backend rejects for any other reason, then logIn rethrows the error untouched', async () => {
      partnersAxios.defaults.adapter = mockAdapter(() => ({ status: 401 }));

      await expect(partnersAuthService.logIn('partner@internxt.com', 'wrong')).rejects.toMatchObject({
        isAxiosError: true,
      });
    });
  });

  describe('requestPasswordReset', () => {
    test('when requestPasswordReset is called, then it posts the email to the forgot-password endpoint', async () => {
      let seenConfig: { url?: string; data?: string } | undefined;
      partnersAxios.defaults.adapter = mockAdapter((config) => {
        seenConfig = config;
        return { status: 200 };
      });

      await partnersAuthService.requestPasswordReset('partner@internxt.com');

      expect(seenConfig?.url).toBe('/partners/forgot-password');
      expect(JSON.parse(seenConfig?.data ?? '{}')).toEqual({ email: 'partner@internxt.com' });
    });

    test('when the backend rejects the captcha, then it maps that into a CaptchaUnavailableError', async () => {
      partnersAxios.defaults.adapter = mockAdapter(() => ({
        status: 403,
        data: { code: 'CAPTCHA_FAILED' },
      }));

      const error = await partnersAuthService.requestPasswordReset('partner@internxt.com').catch((e) => e);

      expect(error.name).toBe('CaptchaUnavailableError');
    });

    test('when the backend rejects for any other reason, then requestPasswordReset rethrows the error untouched', async () => {
      partnersAxios.defaults.adapter = mockAdapter(() => ({ status: 500 }));

      await expect(partnersAuthService.requestPasswordReset('partner@internxt.com')).rejects.toMatchObject({
        isAxiosError: true,
      });
    });
  });

  describe('resetPassword', () => {
    test('when resetPassword is called, then it posts the reset token and the new password', async () => {
      let seenConfig: { url?: string; data?: string } | undefined;
      partnersAxios.defaults.adapter = mockAdapter((config) => {
        seenConfig = config;
        return { status: 200 };
      });

      await partnersAuthService.resetPassword('reset-token', 'new-secret');

      expect(seenConfig?.url).toBe('/partners/reset-password');
      expect(JSON.parse(seenConfig?.data ?? '{}')).toEqual({ token: 'reset-token', newPassword: 'new-secret' });
    });
  });

  describe('token management', () => {
    test('when no one is logged in, then getToken returns null', () => {
      expect(partnersAuthService.getToken()).toBeNull();
    });

    test('when logOut is called, then it clears the stored token', () => {
      partnersAuthService.setToken('a-token');
      partnersAuthService.logOut();
      expect(partnersAuthService.getToken()).toBeNull();
    });
  });

  describe('getRole', () => {
    test('when there is no token, then it returns null', () => {
      expect(partnersAuthService.getRole()).toBeNull();
    });

    test("when a token is stored, then it decodes the role from the token's payload", () => {
      partnersAuthService.setToken(fakeJwt({ role: 'member' }));
      expect(partnersAuthService.getRole()).toBe('member');
    });

    test('when the stored token is malformed, then it returns null', () => {
      partnersAuthService.setToken('not-a-jwt');
      expect(partnersAuthService.getRole()).toBeNull();
    });
  });
});
