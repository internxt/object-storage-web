import { afterEach, describe, expect, it } from 'vitest';
import { managementAuthService } from './management-auth.service';
import managementAxios from '../core/management-axios';
import { mockAdapter } from '../../testing/mock-axios-adapter';
import { stubLocation } from '../../testing/stub-location';

describe('managementAuthService', () => {
  afterEach(() => {
    localStorage.clear();
  });

  stubLocation('/management/login');

  it('getToken returns null when no one is logged in', () => {
    expect(managementAuthService.getToken()).toBeNull();
  });

  it('logIn posts the credentials and stores the returned token', async () => {
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

  it('logIn rejects and stores nothing when the backend rejects the credentials', async () => {
    managementAxios.defaults.adapter = mockAdapter(() => ({ status: 401 }));

    await expect(managementAuthService.logIn('admin@internxt.com', 'wrong')).rejects.toMatchObject({
      isAxiosError: true,
    });
    expect(managementAuthService.getToken()).toBeNull();
  });

  it('logOut clears the stored token', async () => {
    managementAxios.defaults.adapter = mockAdapter(() => ({ status: 200, data: { token: 'management-jwt' } }));
    await managementAuthService.logIn('admin@internxt.com', 'secret');
    expect(managementAuthService.getToken()).toBe('management-jwt');

    managementAuthService.logOut();

    expect(managementAuthService.getToken()).toBeNull();
  });
});
