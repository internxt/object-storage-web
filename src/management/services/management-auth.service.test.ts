import { afterEach, describe, expect, test } from 'vitest';
import { managementAuthService } from './management-auth.service';
import managementAxios from '../core/management-axios';
import { mockAdapter } from '../../testing/mock-axios-adapter';
import { stubLocation } from '../../testing/stub-location';

describe('managementAuthService', () => {
  afterEach(() => {
    localStorage.clear();
  });

  stubLocation('/management/login');

  test('when no one is logged in, then getToken returns null', () => {
    expect(managementAuthService.getToken()).toBeNull();
  });

  test('when logIn succeeds, then it posts the credentials and stores the returned token', async () => {
    let seenConfig: { url?: string; data?: string } | undefined;
    managementAxios.defaults.adapter = mockAdapter((config) => {
      seenConfig = config;
      return { status: 200, data: { token: 'management-jwt' } };
    });

    await managementAuthService.logIn('admin@internxt.com', 'secret');

    expect(seenConfig?.url).toBe('/management/login');
    expect(JSON.parse(seenConfig?.data ?? '{}')).toEqual({ email: 'admin@internxt.com', password: 'secret' });
    expect(managementAuthService.getToken()).toBe('management-jwt');
  });

  test('when logIn returns twoFactorSetupRequired, then it passes the flag on', async () => {
    managementAxios.defaults.adapter = mockAdapter(() => ({
      status: 200,
      data: { token: 'management-jwt', twoFactorSetupRequired: true },
    }));

    await expect(managementAuthService.logIn('admin@internxt.com', 'secret')).resolves.toEqual({
      twoFactorSetupRequired: true,
    });
  });

  test('when the login response has no twoFactorSetupRequired, then the flag is false', async () => {
    managementAxios.defaults.adapter = mockAdapter(() => ({ status: 200, data: { token: 'management-jwt' } }));

    await expect(managementAuthService.logIn('admin@internxt.com', 'secret')).resolves.toEqual({
      twoFactorSetupRequired: false,
    });
  });

  test('when the backend rejects the credentials, then logIn rejects and stores nothing', async () => {
    managementAxios.defaults.adapter = mockAdapter(() => ({ status: 401 }));

    await expect(managementAuthService.logIn('admin@internxt.com', 'wrong')).rejects.toMatchObject({
      isAxiosError: true,
    });
    expect(managementAuthService.getToken()).toBeNull();
  });

  test('when reauthenticate succeeds, then it posts the password and code and stores the returned token', async () => {
    let seenConfig: { url?: string; method?: string; data?: string } | undefined;
    managementAxios.defaults.adapter = mockAdapter((config) => {
      seenConfig = config;
      return { status: 200, data: { token: 'reauth-jwt' } };
    });

    await managementAuthService.reauthenticate('secret', '123456');

    expect(seenConfig?.method).toBe('post');
    expect(seenConfig?.url).toBe('/management/me/reauthenticate');
    expect(JSON.parse(seenConfig?.data ?? '{}')).toEqual({ password: 'secret', code: '123456' });
    expect(managementAuthService.getToken()).toBe('reauth-jwt');
  });

  test('when reauthenticate is called without a code, then the code is omitted', async () => {
    let seenData: string | undefined;
    managementAxios.defaults.adapter = mockAdapter((config) => {
      seenData = config.data;
      return { status: 200, data: { token: 't' } };
    });

    await managementAuthService.reauthenticate('secret');

    expect(JSON.parse(seenData ?? '{}')).toEqual({ password: 'secret' });
  });

  test('when reauthenticate is rejected, then the stored token is kept', async () => {
    managementAuthService.setToken('current-jwt');
    managementAxios.defaults.adapter = mockAdapter(() => ({ status: 403, data: { message: 'Invalid credentials' } }));

    await expect(managementAuthService.reauthenticate('wrong')).rejects.toMatchObject({ isAxiosError: true });
    expect(managementAuthService.getToken()).toBe('current-jwt');
  });

  test('when logOut is called, then it clears the stored token', async () => {
    managementAxios.defaults.adapter = mockAdapter(() => ({ status: 200, data: { token: 'management-jwt' } }));
    await managementAuthService.logIn('admin@internxt.com', 'secret');
    expect(managementAuthService.getToken()).toBe('management-jwt');

    managementAuthService.logOut();

    expect(managementAuthService.getToken()).toBeNull();
  });
});
