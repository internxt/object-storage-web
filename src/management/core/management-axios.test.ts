import { afterEach, describe, expect, test, vi } from 'vitest';
import managementAxios from './management-axios';
import { isReauthCancelled, setReauthHandler } from './management-reauth';
import { managementAuthService } from '../services/management-auth.service';
import { describeScopedAxiosContract } from '../../testing/scoped-axios-contract';
import { mockAdapter } from '../../testing/mock-axios-adapter';
import { stubLocation } from '../../testing/stub-location';

const REAUTH_REQUIRED = { status: 403, data: { code: 'REAUTH_REQUIRED', message: 'Recent authentication required' } };

describe('managementAxios', () => {
  describeScopedAxiosContract(() => managementAxios, managementAuthService, '/management/login');

  describe('when the API asks for recent authentication', () => {
    afterEach(() => {
      setReauthHandler(null);
      localStorage.clear();
    });

    test('when the user confirms, then the request is retried once with the fresh token', async () => {
      stubLocation('/management/settings');
      managementAuthService.setToken('stale-token');
      setReauthHandler(async () => {
        managementAuthService.setToken('fresh-token');
        return true;
      });
      const seenTokens: unknown[] = [];
      managementAxios.defaults.adapter = mockAdapter((config) => {
        seenTokens.push((config.headers as Record<string, unknown>)?.Authorization);
        return seenTokens.length === 1 ? REAUTH_REQUIRED : { status: 204 };
      });

      await expect(managementAxios.delete('/management/members/m1')).resolves.toMatchObject({ status: 204 });

      expect(seenTokens).toEqual(['Bearer stale-token', 'Bearer fresh-token']);
    });

    test('when the user cancels, then the original error is rejected and marked as cancelled', async () => {
      stubLocation('/management/settings');
      setReauthHandler(async () => false);
      let calls = 0;
      managementAxios.defaults.adapter = mockAdapter(() => {
        calls++;
        return REAUTH_REQUIRED;
      });

      const error = await managementAxios.delete('/management/members/m1').catch((err) => err);

      expect(error.response.status).toBe(403);
      expect(isReauthCancelled(error)).toBe(true);
      expect(calls).toBe(1);
    });

    test('when the retry is rejected again, then it does not prompt a second time', async () => {
      stubLocation('/management/settings');
      const handler = vi.fn(async () => true);
      setReauthHandler(handler);
      let calls = 0;
      managementAxios.defaults.adapter = mockAdapter(() => {
        calls++;
        return REAUTH_REQUIRED;
      });

      const error = await managementAxios.post('/management/members', {}).catch((err) => err);

      expect(error.response.status).toBe(403);
      expect(isReauthCancelled(error)).toBe(false);
      expect(handler).toHaveBeenCalledTimes(1);
      expect(calls).toBe(2);
    });

    test('when several requests need it at once, then the user is prompted only once', async () => {
      stubLocation('/management/settings');
      const handler = vi.fn(async () => true);
      setReauthHandler(handler);
      const seen = new Set<string>();
      managementAxios.defaults.adapter = mockAdapter((config) => {
        const first = !seen.has(config.url!);
        seen.add(config.url!);
        return first ? REAUTH_REQUIRED : { status: 204 };
      });

      await Promise.all([
        managementAxios.delete('/management/members/m1'),
        managementAxios.delete('/management/members/m2'),
      ]);

      expect(handler).toHaveBeenCalledTimes(1);
    });

    test('when a 403 has another code, then no prompt is shown', async () => {
      stubLocation('/management/settings');
      const handler = vi.fn(async () => true);
      setReauthHandler(handler);
      managementAxios.defaults.adapter = mockAdapter(() => ({ status: 403, data: { message: 'Forbidden' } }));

      await expect(managementAxios.delete('/management/members/m1')).rejects.toMatchObject({ isAxiosError: true });

      expect(handler).not.toHaveBeenCalled();
    });
  });
});
