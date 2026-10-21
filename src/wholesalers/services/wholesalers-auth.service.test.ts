import { afterEach, describe, expect, test } from 'vitest';
import { wholesalersAuthService } from './wholesalers-auth.service';
import wholesalersAxios from '../core/wholesalers-axios';
import { mockAdapter } from '../../testing/mock-axios-adapter';
import { stubLocation } from '../../testing/stub-location';

function fakeJwt(payload: Record<string, unknown>): string {
  return `header.${btoa(JSON.stringify(payload))}.signature`;
}

describe('wholesalersAuthService', () => {
  stubLocation('/wholesalers/login');

  afterEach(() => {
    localStorage.clear();
  });

  describe('logIn', () => {
    test('when logIn succeeds, then it posts the credentials and 2FA code, and stores the returned token', async () => {
      let seenConfig: { url?: string; data?: string } | undefined;
      wholesalersAxios.defaults.adapter = mockAdapter((config) => {
        seenConfig = config;
        return { status: 200, data: { token: 'wholesalers-jwt', twoFactorSetupRequired: true } };
      });

      const result = await wholesalersAuthService.logIn('wholesaler@internxt.com', 'secret', '123456');

      expect(seenConfig?.url).toBe('/wholesalers/login');
      expect(JSON.parse(seenConfig?.data ?? '{}')).toEqual({
        email: 'wholesaler@internxt.com',
        password: 'secret',
        code: '123456',
      });
      expect(wholesalersAuthService.getToken()).toBe('wholesalers-jwt');
      expect(result).toEqual({ twoFactorSetupRequired: true });
    });

    test('when the backend omits twoFactorSetupRequired, then logIn normalizes it to false', async () => {
      wholesalersAxios.defaults.adapter = mockAdapter(() => ({ status: 200, data: { token: 'wholesalers-jwt' } }));

      const result = await wholesalersAuthService.logIn('wholesaler@internxt.com', 'secret');

      expect(result).toEqual({ twoFactorSetupRequired: false });
    });

    test('when the backend rejects with 2FA_REQUIRED, then logIn maps that into a TwoFactorRequiredError without storing a token', async () => {
      wholesalersAxios.defaults.adapter = mockAdapter(() => ({
        status: 403,
        data: { message: '2FA_REQUIRED' },
      }));

      const error = await wholesalersAuthService.logIn('wholesaler@internxt.com', 'secret').catch((e) => e);

      expect(error.name).toBe('TwoFactorRequiredError');
      expect(wholesalersAuthService.getToken()).toBeNull();
    });

    test('when the backend rejects for any other reason, then logIn rethrows the error untouched', async () => {
      wholesalersAxios.defaults.adapter = mockAdapter(() => ({ status: 401 }));

      await expect(wholesalersAuthService.logIn('wholesaler@internxt.com', 'wrong')).rejects.toMatchObject({
        isAxiosError: true,
      });
    });
  });

  describe('token management', () => {
    test('when no one is logged in, then getToken returns null', () => {
      expect(wholesalersAuthService.getToken()).toBeNull();
    });

    test('when logOut is called, then it clears the stored token', () => {
      wholesalersAuthService.setToken('a-token');
      wholesalersAuthService.logOut();
      expect(wholesalersAuthService.getToken()).toBeNull();
    });
  });

  describe('getPayload / getRole', () => {
    test('when there is no token, then getPayload and getRole return null', () => {
      expect(wholesalersAuthService.getPayload()).toBeNull();
      expect(wholesalersAuthService.getRole()).toBeNull();
    });

    test('when a wholesaler token is stored, then it decodes the wholesaler payload', () => {
      wholesalersAuthService.setToken(fakeJwt({ role: 'wholesaler', wholesalerId: 'w1', email: 'w@internxt.com' }));

      expect(wholesalersAuthService.getRole()).toBe('wholesaler');
      expect(wholesalersAuthService.getPayload()).toEqual({
        role: 'wholesaler',
        wholesalerId: 'w1',
        email: 'w@internxt.com',
      });
    });

    test('when a member token is stored, then it decodes the member payload', () => {
      wholesalersAuthService.setToken(
        fakeJwt({ role: 'member', memberId: 'm1', entityType: 'wholesaler', entityId: 'w1' }),
      );

      expect(wholesalersAuthService.getRole()).toBe('member');
    });

    test('when the stored token is malformed, then getPayload and getRole return null', () => {
      wholesalersAuthService.setToken('not-a-jwt');

      expect(wholesalersAuthService.getPayload()).toBeNull();
      expect(wholesalersAuthService.getRole()).toBeNull();
    });
  });
});
