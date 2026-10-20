import { AxiosHeaders, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { afterEach, expect, it, vi } from 'vitest';
import notificationsService from '../services/notifications.service';

interface ScopedAuthService {
  getToken: () => string | null;
  logOut: () => void;
}

interface MockResult {
  status: number;
  data?: unknown;
}

function mockAdapter(responder: (config: AxiosRequestConfig) => MockResult) {
  return async (config: AxiosRequestConfig): Promise<AxiosResponse> => {
    const result = responder(config);
    if (result.status >= 200 && result.status < 300) {
      return {
        data: result.data ?? {},
        status: result.status,
        statusText: '',
        headers: new AxiosHeaders(),
        config: config as AxiosResponse['config'],
      };
    }
    const error = new Error(`Request failed with status code ${result.status}`) as Error & {
      isAxiosError: boolean;
      config: AxiosRequestConfig;
      response: AxiosResponse;
    };
    error.isAxiosError = true;
    error.config = config;
    error.response = {
      data: result.data ?? {},
      status: result.status,
      statusText: '',
      headers: new AxiosHeaders(),
      config: config as AxiosResponse['config'],
    };
    throw error;
  };
}

function stubLocation(pathname: string): void {
  const stub = { pathname, href: '' } as unknown as Location;
  Object.defineProperty(window, 'location', { value: stub, writable: true, configurable: true });
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

  it('uses the configured object-storage API URL as its baseURL', () => {
    expect(getInstance().defaults.baseURL).toBe(import.meta.env.VITE_OBJECT_STORAGE_API_URL);
  });

  it('attaches the Bearer token from its own auth service when one is present', async () => {
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

  it('does not attach an Authorization header when there is no token', async () => {
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

  it(`logs out, notifies and redirects to ${loginPath} on a 401, when not already on a login page`, async () => {
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

  it('does not redirect or notify again when a 401 happens while already on a login page', async () => {
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

  it('leaves non-401 errors untouched (no logout, no notification, no redirect)', async () => {
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
