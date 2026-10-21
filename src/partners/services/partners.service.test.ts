import { describe, expect, it } from 'vitest';
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
  it('getMe fetches the current partner profile', async () => {
    partnersAxios.defaults.adapter = mockAdapter(() => ({ status: 200, data: { id: 'p1' } }));

    const result = await partnersService.getMe();

    expect(result).toEqual({ id: 'p1' });
  });

  describe('getSubAccounts', () => {
    it('maps the raw rows into the console SubAccount shape', async () => {
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

  it('createSubAccount posts the new sub-account', async () => {
    const req = captureRequest();

    await partnersService.createSubAccount({ name: 'Client', email: 'client@internxt.com', password: 'secret' });

    expect(req.get()?.url).toBe('/partners/sub-accounts');
    expect(parseBody(req.get()?.data)).toEqual({ name: 'Client', email: 'client@internxt.com', password: 'secret' });
  });

  it('updateSubAccountName PATCHes the sub-account name', async () => {
    const req = captureRequest();

    await partnersService.updateSubAccountName('sa1', 'New name');

    expect(req.get()?.url).toBe('/partners/sub-accounts/sa1');
    expect(parseBody(req.get()?.data)).toEqual({ name: 'New name' });
  });

  it('suspendSubAccount PUTs the suspend endpoint', async () => {
    const req = captureRequest();

    await partnersService.suspendSubAccount('sa1');

    expect(req.get()?.url).toBe('/partners/sub-accounts/sa1/suspend');
  });

  it('reactivateSubAccount PUTs the reactivate endpoint', async () => {
    const req = captureRequest();

    await partnersService.reactivateSubAccount('sa1');

    expect(req.get()?.url).toBe('/partners/sub-accounts/sa1/reactivate');
  });

  it('deleteSubAccount DELETEs the sub-account', async () => {
    const req = captureRequest();

    await partnersService.deleteSubAccount('sa1');

    expect(req.get()?.url).toBe('/partners/sub-accounts/sa1');
  });

  it("changeSubAccountPassword PATCHes the sub-account's password", async () => {
    const req = captureRequest();

    await partnersService.changeSubAccountPassword('sa1', 'new-secret');

    expect(req.get()?.url).toBe('/partners/sub-accounts/sa1/password');
    expect(parseBody(req.get()?.data)).toEqual({ newPassword: 'new-secret' });
  });

  it('updateSubAccountStorageQuota PATCHes the storage quota', async () => {
    const req = captureRequest();

    await partnersService.updateSubAccountStorageQuota('sa1', 10);

    expect(req.get()?.url).toBe('/partners/sub-accounts/sa1/storage-quota');
    expect(parseBody(req.get()?.data)).toEqual({ limitTb: 10 });
  });

  it('getUsageSummary fetches the partner usage summary', async () => {
    partnersAxios.defaults.adapter = mockAdapter(() => ({
      status: 200,
      data: { totalSubAccounts: 3, activeStorageTb: 1, deletedStorageTb: 0 },
    }));

    const result = await partnersService.getUsageSummary();

    expect(result).toEqual({ totalSubAccounts: 3, activeStorageTb: 1, deletedStorageTb: 0 });
  });

  it('getSubAccountById fetches the sub-account detail', async () => {
    const req = captureRequest();

    await partnersService.getSubAccountById('sa1');

    expect(req.get()?.url).toBe('/partners/sub-accounts/sa1');
  });

  it('getSubAccountUsages fetches usages with a pagination fallback', async () => {
    partnersAxios.defaults.adapter = mockAdapter(() => ({ status: 200, data: { items: [{ id: 1 }] } }));

    const result = await partnersService.getSubAccountUsages('sa1', { from: '2024-01-01', to: '2024-01-31' });

    expect(result).toEqual({ items: [{ id: 1 }], totalItems: 1 });
  });

  it('listMembers fetches the partner members', async () => {
    partnersAxios.defaults.adapter = mockAdapter(() => ({ status: 200, data: [{ id: 'm1' }] }));

    const result = await partnersService.listMembers();

    expect(result).toEqual([{ id: 'm1' }]);
  });

  it('createMember posts the new member', async () => {
    const req = captureRequest();

    await partnersService.createMember('member@internxt.com', 'secret');

    expect(req.get()?.url).toBe('/partners/members');
    expect(parseBody(req.get()?.data)).toEqual({ email: 'member@internxt.com', password: 'secret' });
  });

  it('deleteMember DELETEs the member', async () => {
    const req = captureRequest();

    await partnersService.deleteMember('m1');

    expect(req.get()?.url).toBe('/partners/members/m1');
  });

  it('updateMember PATCHes the member', async () => {
    const req = captureRequest();

    await partnersService.updateMember('m1', { email: 'new@internxt.com' });

    expect(req.get()?.url).toBe('/partners/members/m1');
    expect(parseBody(req.get()?.data)).toEqual({ email: 'new@internxt.com' });
  });

  it('updateMemberTwoFactor PATCHes the member 2FA action', async () => {
    const req = captureRequest();

    await partnersService.updateMemberTwoFactor('m1', 'disable');

    expect(req.get()?.url).toBe('/partners/members/m1/tfa');
    expect(parseBody(req.get()?.data)).toEqual({ action: 'disable' });
  });

  it('exportDailyUsage fetches the usage export with optional date filters', async () => {
    partnersAxios.defaults.adapter = mockAdapter(() => ({ status: 200, data: [{ date: '2024-01-01', usageGb: 1 }] }));

    const result = await partnersService.exportDailyUsage({ startDate: '2024-01-01' });

    expect(result).toEqual([{ date: '2024-01-01', usageGb: 1 }]);
  });

  it('getSubAccountsUsage fetches and maps the usage report statuses', async () => {
    partnersAxios.defaults.adapter = mockAdapter(() => ({
      status: 200,
      data: { from: '2024-01-01', to: '2024-01-31', items: [{ id: 'sa1', status: 'SUSPENDED' }] },
    }));

    const result = await partnersService.getSubAccountsUsage({ from: '2024-01-01', to: '2024-01-31' });

    expect(result.items[0].status).toBe('SUSPENDED');
  });

  it('createBillingPortalSession posts the current page as the return URL', async () => {
    let seenData: string | undefined;
    partnersAxios.defaults.adapter = mockAdapter((config) => {
      seenData = config.data as string;
      return { status: 200, data: { url: 'https://billing.stripe.com/session' } };
    });

    const result = await partnersService.createBillingPortalSession();

    expect(parseBody(seenData)).toEqual({ returnUrl: window.location.href });
    expect(result).toEqual({ url: 'https://billing.stripe.com/session' });
  });

  it('changePassword stores the rotated token on success', async () => {
    partnersAxios.defaults.adapter = mockAdapter(() => ({ status: 200, data: { token: 'new-jwt' } }));

    await partnersService.changePassword('old', 'new');

    expect(partnersAuthService.getToken()).toBe('new-jwt');
  });

  it('getTwoFactorStatus fetches the current 2FA status', async () => {
    partnersAxios.defaults.adapter = mockAdapter(() => ({ status: 200, data: { enabled: true } }));

    const result = await partnersService.getTwoFactorStatus();

    expect(result).toEqual({ enabled: true });
  });

  it('getTwoFactorSetup fetches the setup secret and QR code', async () => {
    partnersAxios.defaults.adapter = mockAdapter(() => ({ status: 200, data: { secret: 's', qrCode: 'qr' } }));

    const result = await partnersService.getTwoFactorSetup();

    expect(result).toEqual({ secret: 's', qrCode: 'qr' });
  });

  it('enableTwoFactor PUTs the verification code', async () => {
    const req = captureRequest();

    await partnersService.enableTwoFactor('123456');

    expect(req.get()?.url).toBe('/partners/tfa');
    expect(parseBody(req.get()?.data)).toEqual({ code: '123456' });
  });

  it('disableTwoFactor DELETEs with the password and code in the request body', async () => {
    const req = captureRequest();

    await partnersService.disableTwoFactor('secret', '123456');

    expect(req.get()?.url).toBe('/partners/tfa');
    expect(parseBody(req.get()?.data)).toEqual({ password: 'secret', code: '123456' });
  });
});
