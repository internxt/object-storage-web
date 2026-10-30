import { describe, expect, test } from 'vitest';
import { managementMembersService } from './management-members.service';
import { managementAuthService } from './management-auth.service';
import managementAxios from '../core/management-axios';
import { mockAdapter } from '../../testing/mock-axios-adapter';

function parseBody(data: unknown): unknown {
  return JSON.parse((data as string) ?? '{}');
}

describe('managementMembersService', () => {
  test('when getMembers is called, then it returns the members list', async () => {
    const members = [
      { id: 'm1', email: 'a@internxt.com', role: 'owner', twoFactorEnabled: true, createdAt: '2026-10-01' },
    ];
    let seenUrl: string | undefined;
    managementAxios.defaults.adapter = mockAdapter((config) => {
      seenUrl = config.url;
      return { status: 200, data: members };
    });

    await expect(managementMembersService.getMembers()).resolves.toEqual(members);
    expect(seenUrl).toBe('/management/members');
  });

  test('when createMember is called, then it posts email and password', async () => {
    let seenConfig: { url?: string; method?: string; data?: string } | undefined;
    managementAxios.defaults.adapter = mockAdapter((config) => {
      seenConfig = config;
      return { status: 201, data: { id: 'm2' } };
    });

    const result = await managementMembersService.createMember({
      email: 'b@internxt.com',
      password: 'Secret123!',
    });

    expect(result).toEqual({ id: 'm2' });
    expect(seenConfig?.method).toBe('post');
    expect(seenConfig?.url).toBe('/management/members');
    expect(parseBody(seenConfig?.data)).toEqual({ email: 'b@internxt.com', password: 'Secret123!' });
  });

  test('when resetMemberTwoFactor is called, then it patches the member tfa route', async () => {
    let seenConfig: { url?: string; method?: string } | undefined;
    managementAxios.defaults.adapter = mockAdapter((config) => {
      seenConfig = config;
      return { status: 204 };
    });

    await managementMembersService.resetMemberTwoFactor('m1');

    expect(seenConfig?.method).toBe('patch');
    expect(seenConfig?.url).toBe('/management/members/m1/tfa');
  });

  test('when deleteMember is called, then it sends a DELETE to the member', async () => {
    let seenConfig: { url?: string; method?: string } | undefined;
    managementAxios.defaults.adapter = mockAdapter((config) => {
      seenConfig = config;
      return { status: 204 };
    });

    await managementMembersService.deleteMember('m1');

    expect(seenConfig?.method).toBe('delete');
    expect(seenConfig?.url).toBe('/management/members/m1');
  });

  test('when changeOwnPassword succeeds, then it stores the fresh token', async () => {
    let seenConfig: { url?: string; method?: string; data?: string } | undefined;
    managementAxios.defaults.adapter = mockAdapter((config) => {
      seenConfig = config;
      return { status: 200, data: { token: 'fresh-token' } };
    });

    await managementMembersService.changeOwnPassword('Old123!aa', 'New123!aa', '123456');

    expect(seenConfig?.method).toBe('put');
    expect(seenConfig?.url).toBe('/management/me/password');
    expect(parseBody(seenConfig?.data)).toEqual({ oldPassword: 'Old123!aa', newPassword: 'New123!aa', code: '123456' });
    expect(managementAuthService.getToken()).toBe('fresh-token');
  });

  test('when changeOwnPassword is called without a code, then the code is omitted', async () => {
    let seenData: string | undefined;
    managementAxios.defaults.adapter = mockAdapter((config) => {
      seenData = config.data;
      return { status: 200, data: { token: 't' } };
    });

    await managementMembersService.changeOwnPassword('Old123!aa', 'New123!aa');

    expect(parseBody(seenData)).toEqual({ oldPassword: 'Old123!aa', newPassword: 'New123!aa' });
  });
});
