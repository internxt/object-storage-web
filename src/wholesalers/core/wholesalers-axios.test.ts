import { afterEach, describe, expect, test, vi } from 'vitest';
import wholesalersAxios from './wholesalers-axios';
import { wholesalersAuthService } from '../services/wholesalers-auth.service';
import notificationsService from '../../services/notifications.service';
import { describeScopedAxiosContract } from '../../testing/scoped-axios-contract';
import { mockAdapter } from '../../testing/mock-axios-adapter';
import { stubLocation } from '../../testing/stub-location';

describe('wholesalersAxios', () => {
  describeScopedAxiosContract(() => wholesalersAxios, wholesalersAuthService, '/wholesalers/login');

  describe('on the password recovery pages', () => {
    const realLocation = window.location;

    afterEach(() => {
      Object.defineProperty(window, 'location', { value: realLocation, writable: true, configurable: true });
      vi.restoreAllMocks();
    });

    test.each(['/wholesalers/forgot-password', '/wholesalers/reset-password'])(
      'when a stale token gets a 401 on %s, then it does not log out, notify or redirect away',
      async (pathname) => {
        vi.spyOn(wholesalersAuthService, 'getToken').mockReturnValue('stale-token');
        const logOutSpy = vi.spyOn(wholesalersAuthService, 'logOut').mockImplementation(() => {});
        const notifySpy = vi.spyOn(notificationsService, 'error').mockImplementation(() => {});
        stubLocation(pathname);
        wholesalersAxios.defaults.adapter = mockAdapter(() => ({ status: 401 }));

        await expect(wholesalersAxios.get('/wholesalers/me')).rejects.toMatchObject({ isAxiosError: true });

        expect(logOutSpy).not.toHaveBeenCalled();
        expect(notifySpy).not.toHaveBeenCalled();
        expect(window.location.href).toBe('');
      },
    );
  });
});
