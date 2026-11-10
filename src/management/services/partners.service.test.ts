import { describe, expect, test } from 'vitest';
import { partnersService } from './partners.service';
import managementAxios from '../core/management-axios';
import { mockAdapter } from '../../testing/mock-axios-adapter';

function parseBody(data: unknown): unknown {
  return JSON.parse((data as string) ?? '{}');
}

describe('management partnersService', () => {
  test('when createPartner is called, then it posts the new partner', async () => {
    let seenConfig: { url?: string; data?: string } | undefined;
    managementAxios.defaults.adapter = mockAdapter((config) => {
      seenConfig = config;
      return { status: 200 };
    });

    await partnersService.createPartner({
      name: 'Acme',
      email: 'acme@internxt.com',
      password: 'secret',
      country: 'ES',
      postalCode: '08001',
    });

    expect(seenConfig?.url).toBe('/management/partners');
    expect(parseBody(seenConfig?.data)).toEqual({
      name: 'Acme',
      email: 'acme@internxt.com',
      password: 'secret',
      country: 'ES',
      postalCode: '08001',
    });
  });

  describe('getPartners', () => {
    test('when the backend returns a pagination envelope, then it maps the raw rows into the Partner shape', async () => {
      let seenConfig: { url?: string; params?: unknown } | undefined;
      managementAxios.defaults.adapter = mockAdapter((config) => {
        seenConfig = config;
        return {
          status: 200,
          data: {
            items: [{ id: 'p1', storageProviderId: 'sp1', name: 'Acme', email: 'a@b.com', status: 'DELETED' }],
            total: 1,
          },
        };
      });

      const result = await partnersService.getPartners({ page: 1, perPage: 20 });

      expect(seenConfig?.url).toBe('/management/partners');
      expect(seenConfig?.params).toEqual({ page: 1, perPage: 20 });
      expect(result).toEqual({
        total: 1,
        partners: [
          {
            id: 'p1',
            storageProviderId: 'sp1',
            name: 'Acme',
            email: 'a@b.com',
            status: 'DELETED',
            providerCreatedAt: null,
            activeStorageTb: 0,
            subAccountsCount: 0,
            createdAt: '',
            customerId: null,
          },
        ],
      });
    });

    test('when the backend returns a bare array (no pagination envelope), then it still maps the rows', async () => {
      managementAxios.defaults.adapter = mockAdapter(() => ({
        status: 200,
        data: [{ id: 'p1', storageProviderId: 'sp1', status: 'ACTIVE' }],
      }));

      const result = await partnersService.getPartners({});

      expect(result.total).toBe(1);
      expect(result.partners[0].status).toBe('ACTIVE');
    });
  });

  test('when getPartnerById is called, then it fetches and maps a single partner', async () => {
    let seenConfig: { url?: string } | undefined;
    managementAxios.defaults.adapter = mockAdapter((config) => {
      seenConfig = config;
      return { status: 200, data: { id: 'p1', storageProviderId: 'sp1', status: 'ACTIVE' } };
    });

    const result = await partnersService.getPartnerById('p1');

    expect(seenConfig?.url).toBe('/management/partners/p1');
    expect(result.status).toBe('ACTIVE');
  });

  test('when deletePartner is called, then it sends a DELETE to the partner', async () => {
    let seenConfig: { url?: string; method?: string } | undefined;
    managementAxios.defaults.adapter = mockAdapter((config) => {
      seenConfig = config;
      return { status: 204 };
    });

    await partnersService.deletePartner('p-1');

    expect(seenConfig?.method).toBe('delete');
    expect(seenConfig?.url).toBe('/management/partners/p-1');
  });

  test('when getPartnersSummary is called, then it returns the mapped summary with sensible defaults', async () => {
    managementAxios.defaults.adapter = mockAdapter(() => ({ status: 200, data: {} }));

    const result = await partnersService.getPartnersSummary();

    expect(result).toEqual({ totalPartners: 0, activeStorageTb: 0 });
  });

  test('when getPartnerSubAccounts is called, then it fetches a partner sub-accounts page', async () => {
    let seenConfig: { url?: string; params?: unknown } | undefined;
    managementAxios.defaults.adapter = mockAdapter((config) => {
      seenConfig = config;
      return { status: 200, data: { items: [{ id: 'sa1' }], total: 1 } };
    });

    const result = await partnersService.getPartnerSubAccounts('p1', { page: 1, perPage: 10 });

    expect(seenConfig?.url).toBe('/management/partners/p1/sub-accounts');
    expect(seenConfig?.params).toEqual({ page: 1, perPage: 10 });
    expect(result).toEqual({ items: [{ id: 'sa1' }], total: 1 });
  });

  test('when getPartnerSubAccountsUsage is called, then it fetches and maps the usage report statuses', async () => {
    let seenConfig: { url?: string; params?: unknown } | undefined;
    managementAxios.defaults.adapter = mockAdapter((config) => {
      seenConfig = config;
      return {
        status: 200,
        data: {
          from: '2024-01-01',
          to: '2024-01-31',
          items: [{ id: 'sa1', status: 'ACTIVE' }],
        },
      };
    });

    const result = await partnersService.getPartnerSubAccountsUsage('p1', { from: '2024-01-01', to: '2024-01-31' });

    expect(seenConfig?.url).toBe('/management/partners/p1/usages/sub-accounts');
    expect(seenConfig?.params).toEqual({ from: '2024-01-01', to: '2024-01-31' });
    expect(result.items[0].status).toBe('PAID_ACCOUNT');
  });
});
