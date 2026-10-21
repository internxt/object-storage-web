import { AxiosInstance } from 'axios';
import { afterEach, expect, test, vi } from 'vitest';
import notificationsService from '../services/notifications.service';
import { mockAdapter } from './mock-axios-adapter';
import { stubLocation } from './stub-location';

interface ScopedAuthService {
  getToken: () => string | null;
  logOut: () => void;
}

/**
 * Shared behavior contract every per-area scoped axios instance (management, partners,
 * wholesalers, sub-account...) must satisfy, so none of them can regress into the
 * global-axios-interceptor bug this file set replaced.
 */
export function describeScopedAxiosContract(
  getInstance: () => AxiosInstance,
  authService: ScopedAuthService,
  loginPath: string,
) {
  const realLocation = window.location;

  afterEach(() => {
    Object.defineProperty(window, 'location', { value: realLocation, writable: true, configurable: true });
    vi.restoreAllMocks();
  });

  test('when the instance is created, then its baseURL is the configured object-storage API URL', () => {
    expect(getInstance().defaults.baseURL).toBe(import.meta.env.VITE_OBJECT_STORAGE_API_URL);
  });

  test('when the auth service has a token, then the request carries a Bearer Authorization header', async () => {
    vi.spyOn(authService, 'getToken').mockReturnValue('a-token');
    stubLocation('/some/page');
    let seenAuthHeader: unknown;
    getInstance().defaults.adapter = mockAdapter((config) => {
      seenAuthHeader = (config.headers as Record<string, unknown>)?.Authorization;
      return { status: 200 };
    });

    await getInstance().get('/anything');

    expect(seenAuthHeader).toBe('Bearer a-token');
  });

  test('when the auth service has no token, then no Authorization header is attached', async () => {
    vi.spyOn(authService, 'getToken').mockReturnValue(null);
    stubLocation('/some/page');
    let seenAuthHeader: unknown;
    getInstance().defaults.adapter = mockAdapter((config) => {
      seenAuthHeader = (config.headers as Record<string, unknown>)?.Authorization;
      return { status: 200 };
    });

    await getInstance().get('/anything');

    expect(seenAuthHeader).toBeUndefined();
  });

  test(`when a 401 happens and the user is not already on a login page, then it logs out, notifies and redirects to ${loginPath}`, async () => {
    vi.spyOn(authService, 'getToken').mockReturnValue('a-token');
    const logOutSpy = vi.spyOn(authService, 'logOut').mockImplementation(() => {});
    const notifySpy = vi.spyOn(notificationsService, 'error').mockImplementation(() => {});
    stubLocation('/some/protected/page');
    getInstance().defaults.adapter = mockAdapter(() => ({ status: 401 }));

    await expect(getInstance().get('/anything')).rejects.toMatchObject({ isAxiosError: true });

    expect(logOutSpy).toHaveBeenCalledTimes(1);
    expect(notifySpy).toHaveBeenCalledTimes(1);
    expect(window.location.href.startsWith(loginPath)).toBe(true);
  });

  test('when a 401 happens while already on a login page, then it does not redirect or notify again', async () => {
    vi.spyOn(authService, 'getToken').mockReturnValue(null);
    const logOutSpy = vi.spyOn(authService, 'logOut').mockImplementation(() => {});
    const notifySpy = vi.spyOn(notificationsService, 'error').mockImplementation(() => {});
    stubLocation(loginPath);
    getInstance().defaults.adapter = mockAdapter(() => ({ status: 401 }));

    await expect(getInstance().get('/anything')).rejects.toMatchObject({ isAxiosError: true });

    expect(logOutSpy).not.toHaveBeenCalled();
    expect(notifySpy).not.toHaveBeenCalled();
    expect(window.location.href).toBe('');
  });

  test('when a non-401 error happens, then it is left untouched (no logout, no notification, no redirect)', async () => {
    const logOutSpy = vi.spyOn(authService, 'logOut').mockImplementation(() => {});
    const notifySpy = vi.spyOn(notificationsService, 'error').mockImplementation(() => {});
    stubLocation('/some/protected/page');
    getInstance().defaults.adapter = mockAdapter(() => ({ status: 500 }));

    await expect(getInstance().get('/anything')).rejects.toMatchObject({ isAxiosError: true });

    expect(logOutSpy).not.toHaveBeenCalled();
    expect(notifySpy).not.toHaveBeenCalled();
    expect(window.location.href).toBe('');
  });
}
