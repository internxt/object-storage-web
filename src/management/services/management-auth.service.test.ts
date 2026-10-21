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

  test('when the backend rejects the credentials, then logIn rejects and stores nothing', async () => {
    managementAxios.defaults.adapter = mockAdapter(() => ({ status: 401 }));

    await expect(managementAuthService.logIn('admin@internxt.com', 'wrong')).rejects.toMatchObject({
      isAxiosError: true,
    });
    expect(managementAuthService.getToken()).toBeNull();
  });

  test('when logOut is called, then it clears the stored token', async () => {
    managementAxios.defaults.adapter = mockAdapter(() => ({ status: 200, data: { token: 'management-jwt' } }));
    await managementAuthService.logIn('admin@internxt.com', 'secret');
    expect(managementAuthService.getToken()).toBe('management-jwt');

    managementAuthService.logOut();

    expect(managementAuthService.getToken()).toBeNull();
  });
});
