import { afterEach, describe, expect, it } from 'vitest';
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
    it('posts the credentials and 2FA code, and stores the returned token', async () => {
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

    it('normalizes a missing twoFactorSetupRequired flag to false', async () => {
      wholesalersAxios.defaults.adapter = mockAdapter(() => ({ status: 200, data: { token: 'wholesalers-jwt' } }));

      const result = await wholesalersAuthService.logIn('wholesaler@internxt.com', 'secret');

      expect(result).toEqual({ twoFactorSetupRequired: false });
    });

    it('maps a 2FA_REQUIRED rejection into a TwoFactorRequiredError, without storing a token', async () => {
      wholesalersAxios.defaults.adapter = mockAdapter(() => ({
        status: 403,
        data: { message: '2FA_REQUIRED' },
      }));

      const error = await wholesalersAuthService.logIn('wholesaler@internxt.com', 'secret').catch((e) => e);

      expect(error.name).toBe('TwoFactorRequiredError');
      expect(wholesalersAuthService.getToken()).toBeNull();
    });

    it('rethrows any other error untouched', async () => {
      wholesalersAxios.defaults.adapter = mockAdapter(() => ({ status: 401 }));

      await expect(wholesalersAuthService.logIn('wholesaler@internxt.com', 'wrong')).rejects.toMatchObject({
        isAxiosError: true,
      });
    });
  });

  describe('token management', () => {
    it('getToken returns null when no one is logged in', () => {
      expect(wholesalersAuthService.getToken()).toBeNull();
    });

    it('logOut clears the stored token', () => {
      wholesalersAuthService.setToken('a-token');
      wholesalersAuthService.logOut();
      expect(wholesalersAuthService.getToken()).toBeNull();
    });
  });

  describe('getPayload / getRole', () => {
    it('returns null when there is no token', () => {
      expect(wholesalersAuthService.getPayload()).toBeNull();
      expect(wholesalersAuthService.getRole()).toBeNull();
    });

    it('decodes a wholesaler payload', () => {
      wholesalersAuthService.setToken(fakeJwt({ role: 'wholesaler', wholesalerId: 'w1', email: 'w@internxt.com' }));

      expect(wholesalersAuthService.getRole()).toBe('wholesaler');
      expect(wholesalersAuthService.getPayload()).toEqual({
        role: 'wholesaler',
        wholesalerId: 'w1',
        email: 'w@internxt.com',
      });
    });

    it('decodes a member payload', () => {
      wholesalersAuthService.setToken(
        fakeJwt({ role: 'member', memberId: 'm1', entityType: 'wholesaler', entityId: 'w1' }),
      );

      expect(wholesalersAuthService.getRole()).toBe('member');
    });

    it('returns null when the stored token is malformed', () => {
      wholesalersAuthService.setToken('not-a-jwt');

      expect(wholesalersAuthService.getPayload()).toBeNull();
      expect(wholesalersAuthService.getRole()).toBeNull();
    });
  });
});
