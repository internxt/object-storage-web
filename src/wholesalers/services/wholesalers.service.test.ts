import { describe, expect, test } from 'vitest';
import { wholesalersService } from './wholesalers.service';
import { wholesalersAuthService } from './wholesalers-auth.service';
import wholesalersAxios from '../core/wholesalers-axios';
import { mockAdapter } from '../../testing/mock-axios-adapter';

function parseBody(data: unknown): unknown {
  return JSON.parse((data as string) ?? '{}');
}

function captureRequest(): { get: () => { url?: string; data?: string; params?: unknown } | undefined } {
  let seen: { url?: string; data?: string; params?: unknown } | undefined;
  wholesalersAxios.defaults.adapter = mockAdapter((config) => {
    seen = config;
    return { status: 200, data: {} };
  });
  return { get: () => seen };
}

describe('wholesalersService', () => {
  test('when getPartners is called, then it fetches a page of the wholesaler own partners', async () => {
    let seenConfig: { url?: string; params?: unknown } | undefined;
    wholesalersAxios.defaults.adapter = mockAdapter((config) => {
      seenConfig = config;
      return { status: 200, data: { items: [{ id: 'p1' }], total: 1 } };
    });

    const result = await wholesalersService.getPartners({ page: 1, perPage: 20 });

    expect(seenConfig?.url).toBe('/wholesalers/partners');
    expect(seenConfig?.params).toEqual({ page: 1, perPage: 20 });
    expect(result).toEqual({ partners: [{ id: 'p1' }], total: 1 });
  });

  test('when createPartner is called, then it posts the new partner', async () => {
    const req = captureRequest();

    await wholesalersService.createPartner({ name: 'Acme', email: 'acme@internxt.com', password: 'secret' });

    expect(req.get()?.url).toBe('/wholesalers/partners');
    expect(parseBody(req.get()?.data)).toEqual({ name: 'Acme', email: 'acme@internxt.com', password: 'secret' });
  });

  test('when updatePartnerName is called, then it PATCHes the partner name', async () => {
    const req = captureRequest();

    await wholesalersService.updatePartnerName('p1', 'New name');

    expect(req.get()?.url).toBe('/wholesalers/partners/p1');
    expect(parseBody(req.get()?.data)).toEqual({ name: 'New name' });
  });

  test('when deletePartner is called, then it DELETEs the partner', async () => {
    const req = captureRequest();

    await wholesalersService.deletePartner('p1');

    expect(req.get()?.url).toBe('/wholesalers/partners/p1');
  });

  test('when getPartnerUsageSummary is called, then it fetches a single partner usage summary', async () => {
    wholesalersAxios.defaults.adapter = mockAdapter(() => ({
      status: 200,
      data: { totalSubAccounts: 2, activeStorageTb: 1, deletedStorageTb: 0 },
    }));

    const result = await wholesalersService.getPartnerUsageSummary('p1');

    expect(result).toEqual({ totalSubAccounts: 2, activeStorageTb: 1, deletedStorageTb: 0 });
  });

  test('when getUsageSummary is called, then it fetches the wholesaler usage summary', async () => {
    wholesalersAxios.defaults.adapter = mockAdapter(() => ({
      status: 200,
      data: { totalPartners: 3, activeStorageTb: 4 },
    }));

    const result = await wholesalersService.getUsageSummary();

    expect(result).toEqual({ totalPartners: 3, activeStorageTb: 4 });
  });

  test('when createBillingPortalSession is called, then it posts the current page as the return URL', async () => {
    let seenData: string | undefined;
    wholesalersAxios.defaults.adapter = mockAdapter((config) => {
      seenData = config.data as string;
      return { status: 200, data: { url: 'https://billing.stripe.com/session' } };
    });

    const result = await wholesalersService.createBillingPortalSession();

    expect(parseBody(seenData)).toEqual({ returnUrl: window.location.href });
    expect(result).toEqual({ url: 'https://billing.stripe.com/session' });
  });

  test('when changePassword succeeds, then it stores the rotated token', async () => {
    wholesalersAxios.defaults.adapter = mockAdapter(() => ({ status: 200, data: { token: 'new-jwt' } }));

    await wholesalersService.changePassword('old', 'new');

    expect(wholesalersAuthService.getToken()).toBe('new-jwt');
  });

  test('when getTwoFactorStatus is called, then it fetches the current 2FA status', async () => {
    wholesalersAxios.defaults.adapter = mockAdapter(() => ({ status: 200, data: { enabled: false } }));

    const result = await wholesalersService.getTwoFactorStatus();

    expect(result).toEqual({ enabled: false });
  });

  test('when getTwoFactorSetup is called, then it fetches the setup secret and QR code', async () => {
    wholesalersAxios.defaults.adapter = mockAdapter(() => ({ status: 200, data: { secret: 's', qrCode: 'qr' } }));

    const result = await wholesalersService.getTwoFactorSetup();

    expect(result).toEqual({ secret: 's', qrCode: 'qr' });
  });

  test('when enableTwoFactor is called, then it PUTs the verification code', async () => {
    const req = captureRequest();

    await wholesalersService.enableTwoFactor('123456');

    expect(req.get()?.url).toBe('/wholesalers/tfa');
    expect(parseBody(req.get()?.data)).toEqual({ code: '123456' });
  });

  test('when disableTwoFactor is called, then it DELETEs with the password and code in the request body', async () => {
    const req = captureRequest();

    await wholesalersService.disableTwoFactor('secret', '123456');

    expect(req.get()?.url).toBe('/wholesalers/tfa');
    expect(parseBody(req.get()?.data)).toEqual({ password: 'secret', code: '123456' });
  });

  test('when getMe is called, then it fetches the current wholesaler profile', async () => {
    wholesalersAxios.defaults.adapter = mockAdapter(() => ({ status: 200, data: { id: 'w1' } }));

    const result = await wholesalersService.getMe();

    expect(result).toEqual({ id: 'w1' });
  });

  test('when listMembers is called, then it fetches the wholesaler members', async () => {
    wholesalersAxios.defaults.adapter = mockAdapter(() => ({ status: 200, data: [{ id: 'm1' }] }));

    const result = await wholesalersService.listMembers();

    expect(result).toEqual([{ id: 'm1' }]);
  });

  test('when createMember is called, then it posts the new member', async () => {
    const req = captureRequest();

    await wholesalersService.createMember('member@internxt.com', 'secret');

    expect(req.get()?.url).toBe('/wholesalers/members');
    expect(parseBody(req.get()?.data)).toEqual({ email: 'member@internxt.com', password: 'secret' });
  });

  test('when updateMember is called, then it PATCHes the member', async () => {
    const req = captureRequest();

    await wholesalersService.updateMember('m1', { email: 'new@internxt.com' });

    expect(req.get()?.url).toBe('/wholesalers/members/m1');
    expect(parseBody(req.get()?.data)).toEqual({ email: 'new@internxt.com' });
  });

  test('when deleteMember is called, then it DELETEs the member', async () => {
    const req = captureRequest();

    await wholesalersService.deleteMember('m1');

    expect(req.get()?.url).toBe('/wholesalers/members/m1');
  });

  test('when updateMemberTwoFactor is called, then it PATCHes the member 2FA action', async () => {
    const req = captureRequest();

    await wholesalersService.updateMemberTwoFactor('m1', 'reset');

    expect(req.get()?.url).toBe('/wholesalers/members/m1/tfa');
    expect(parseBody(req.get()?.data)).toEqual({ action: 'reset' });
  });
});
