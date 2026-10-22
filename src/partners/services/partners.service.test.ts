import { describe, expect, test } from 'vitest';
import { partnersService } from './partners.service';
import { partnersAuthService } from './partners-auth.service';
import partnersAxios from '../core/partners-axios';
import { mockAdapter } from '../../testing/mock-axios-adapter';

function parseBody(data: unknown): unknown {
  return JSON.parse((data as string) ?? '{}');
}

function captureRequest(): { get: () => { url?: string; data?: string; params?: unknown } | undefined } {
  let seen: { url?: string; data?: string; params?: unknown } | undefined;
  partnersAxios.defaults.adapter = mockAdapter((config) => {
    seen = config;
    return { status: 200, data: {} };
  });
  return { get: () => seen };
}

describe('partners partnersService', () => {
  test('when getMe is called, then it fetches the current partner profile', async () => {
    partnersAxios.defaults.adapter = mockAdapter(() => ({ status: 200, data: { id: 'p1' } }));

    const result = await partnersService.getMe();

    expect(result).toEqual({ id: 'p1' });
  });

  describe('getSubAccounts', () => {
    test('when the backend returns a pagination envelope, then it maps the raw rows into the console SubAccount shape', async () => {
      let seenConfig: { url?: string; params?: unknown } | undefined;
      partnersAxios.defaults.adapter = mockAdapter((config) => {
        seenConfig = config;
        return {
          status: 200,
          data: {
            items: [
              {
                id: 'sa1',
                email: 'client@internxt.com',
                name: 'Client',
                status: 'SUSPENDED',
                activeStorageBytes: 2_000_000_000_000,
                deletedStorageBytes: 0,
                storageQuotaTb: 5,
                createdAt: '2024-01-01T00:00:00.000Z',
              },
            ],
            total: 1,
          },
        };
      });

      const result = await partnersService.getSubAccounts({ page: 1 });

      expect(seenConfig?.url).toBe('/partners/sub-accounts');
      expect(seenConfig?.params).toEqual({ page: 1 });
      expect(result.subAccounts[0]).toMatchObject({
        id: 'sa1',
        name: 'Client',
        email: 'client@internxt.com',
        status: 'SUSPENDED',
        activeStorage: 2,
        storageQuotaTb: 5,
      });
    });
  });

  test('when createSubAccount is called, then it posts the new sub-account', async () => {
    const req = captureRequest();

    await partnersService.createSubAccount({ name: 'Client', email: 'client@internxt.com', password: 'secret' });

    expect(req.get()?.url).toBe('/partners/sub-accounts');
    expect(parseBody(req.get()?.data)).toEqual({ name: 'Client', email: 'client@internxt.com', password: 'secret' });
  });

  test('when updateSubAccountName is called, then it PATCHes the sub-account name', async () => {
    const req = captureRequest();

    await partnersService.updateSubAccountName('sa1', 'New name');

    expect(req.get()?.url).toBe('/partners/sub-accounts/sa1');
    expect(parseBody(req.get()?.data)).toEqual({ name: 'New name' });
  });

  test('when suspendSubAccount is called, then it PUTs the suspend endpoint', async () => {
    const req = captureRequest();

    await partnersService.suspendSubAccount('sa1');

    expect(req.get()?.url).toBe('/partners/sub-accounts/sa1/suspend');
  });

  test('when reactivateSubAccount is called, then it PUTs the reactivate endpoint', async () => {
    const req = captureRequest();

    await partnersService.reactivateSubAccount('sa1');

    expect(req.get()?.url).toBe('/partners/sub-accounts/sa1/reactivate');
  });

  test('when deleteSubAccount is called, then it DELETEs the sub-account', async () => {
    const req = captureRequest();

    await partnersService.deleteSubAccount('sa1');

    expect(req.get()?.url).toBe('/partners/sub-accounts/sa1');
  });

  test("when changeSubAccountPassword is called, then it PATCHes the sub-account's password", async () => {
    const req = captureRequest();

    await partnersService.changeSubAccountPassword('sa1', 'new-secret');

    expect(req.get()?.url).toBe('/partners/sub-accounts/sa1/password');
    expect(parseBody(req.get()?.data)).toEqual({ newPassword: 'new-secret' });
  });

  test('when updateSubAccountStorageLimit is called with a limit, then it PATCHes its type and value', async () => {
    const req = captureRequest();

    await partnersService.updateSubAccountStorageLimit('sa1', { type: 'alert', valueTb: 2.5 });

    expect(req.get()?.url).toBe('/partners/sub-accounts/sa1/storage-limit');
    expect(parseBody(req.get()?.data)).toEqual({ type: 'alert', valueTb: 2.5 });
  });

  test('when updateSubAccountStorageLimit is called with no limit, then it PATCHes a null value', async () => {
    const req = captureRequest();

    await partnersService.updateSubAccountStorageLimit('sa1', { type: 'none' });

    expect(parseBody(req.get()?.data)).toEqual({ type: 'none', valueTb: null });
  });

  test('when getUsageSummary is called, then it fetches the partner usage summary', async () => {
    partnersAxios.defaults.adapter = mockAdapter(() => ({
      status: 200,
      data: { totalSubAccounts: 3, activeStorageTb: 1, deletedStorageTb: 0 },
    }));

    const result = await partnersService.getUsageSummary();

    expect(result).toEqual({ totalSubAccounts: 3, activeStorageTb: 1, deletedStorageTb: 0 });
  });

  test('when getSubAccountById is called, then it fetches the sub-account detail', async () => {
    const req = captureRequest();

    await partnersService.getSubAccountById('sa1');

    expect(req.get()?.url).toBe('/partners/sub-accounts/sa1');
  });

  test('when getSubAccountUsages is called, then it fetches usages with a pagination fallback', async () => {
    partnersAxios.defaults.adapter = mockAdapter(() => ({ status: 200, data: { items: [{ id: 1 }] } }));

    const result = await partnersService.getSubAccountUsages('sa1', { from: '2024-01-01', to: '2024-01-31' });

    expect(result).toEqual({ items: [{ id: 1 }], totalItems: 1 });
  });

  test('when listMembers is called, then it fetches the partner members', async () => {
    partnersAxios.defaults.adapter = mockAdapter(() => ({ status: 200, data: [{ id: 'm1' }] }));

    const result = await partnersService.listMembers();

    expect(result).toEqual([{ id: 'm1' }]);
  });

  test('when createMember is called, then it posts the new member', async () => {
    const req = captureRequest();

    await partnersService.createMember('member@internxt.com', 'secret');

    expect(req.get()?.url).toBe('/partners/members');
    expect(parseBody(req.get()?.data)).toEqual({ email: 'member@internxt.com', password: 'secret' });
  });

  test('when deleteMember is called, then it DELETEs the member', async () => {
    const req = captureRequest();

    await partnersService.deleteMember('m1');

    expect(req.get()?.url).toBe('/partners/members/m1');
  });

  test('when updateMember is called, then it PATCHes the member', async () => {
    const req = captureRequest();

    await partnersService.updateMember('m1', { email: 'new@internxt.com' });

    expect(req.get()?.url).toBe('/partners/members/m1');
    expect(parseBody(req.get()?.data)).toEqual({ email: 'new@internxt.com' });
  });

  test('when updateMemberTwoFactor is called, then it PATCHes the member 2FA action', async () => {
    const req = captureRequest();

    await partnersService.updateMemberTwoFactor('m1', 'disable');

    expect(req.get()?.url).toBe('/partners/members/m1/tfa');
    expect(parseBody(req.get()?.data)).toEqual({ action: 'disable' });
  });

  test('when exportDailyUsage is called, then it fetches the usage export with optional date filters', async () => {
    partnersAxios.defaults.adapter = mockAdapter(() => ({ status: 200, data: [{ date: '2024-01-01', usageGb: 1 }] }));

    const result = await partnersService.exportDailyUsage({ startDate: '2024-01-01' });

    expect(result).toEqual([{ date: '2024-01-01', usageGb: 1 }]);
  });

  test('when getSubAccountsUsage is called, then it fetches and maps the usage report statuses', async () => {
    partnersAxios.defaults.adapter = mockAdapter(() => ({
      status: 200,
      data: { from: '2024-01-01', to: '2024-01-31', items: [{ id: 'sa1', status: 'SUSPENDED' }] },
    }));

    const result = await partnersService.getSubAccountsUsage({ from: '2024-01-01', to: '2024-01-31' });

    expect(result.items[0].status).toBe('SUSPENDED');
  });

  test('when createBillingPortalSession is called, then it posts the current page as the return URL', async () => {
    let seenData: string | undefined;
    partnersAxios.defaults.adapter = mockAdapter((config) => {
      seenData = config.data as string;
      return { status: 200, data: { url: 'https://billing.stripe.com/session' } };
    });

    const result = await partnersService.createBillingPortalSession();

    expect(parseBody(seenData)).toEqual({ returnUrl: window.location.href });
    expect(result).toEqual({ url: 'https://billing.stripe.com/session' });
  });

  test('when changePassword succeeds, then it stores the rotated token', async () => {
    partnersAxios.defaults.adapter = mockAdapter(() => ({ status: 200, data: { token: 'new-jwt' } }));

    await partnersService.changePassword('old', 'new');

    expect(partnersAuthService.getToken()).toBe('new-jwt');
  });

  test('when getTwoFactorStatus is called, then it fetches the current 2FA status', async () => {
    partnersAxios.defaults.adapter = mockAdapter(() => ({ status: 200, data: { enabled: true } }));

    const result = await partnersService.getTwoFactorStatus();

    expect(result).toEqual({ enabled: true });
  });

  test('when getTwoFactorSetup is called, then it fetches the setup secret and QR code', async () => {
    partnersAxios.defaults.adapter = mockAdapter(() => ({ status: 200, data: { secret: 's', qrCode: 'qr' } }));

    const result = await partnersService.getTwoFactorSetup();

    expect(result).toEqual({ secret: 's', qrCode: 'qr' });
  });

  test('when enableTwoFactor is called, then it PUTs the verification code', async () => {
    const req = captureRequest();

    await partnersService.enableTwoFactor('123456');

    expect(req.get()?.url).toBe('/partners/tfa');
    expect(parseBody(req.get()?.data)).toEqual({ code: '123456' });
  });

  test('when disableTwoFactor is called, then it DELETEs with the password and code in the request body', async () => {
    const req = captureRequest();

    await partnersService.disableTwoFactor('secret', '123456');

    expect(req.get()?.url).toBe('/partners/tfa');
    expect(parseBody(req.get()?.data)).toEqual({ password: 'secret', code: '123456' });
  });
});
