import { describe, expect, it } from 'vitest';
import { managementService } from './management.service';
import managementAxios from '../core/management-axios';
import { mockAdapter } from '../../testing/mock-axios-adapter';

function parseBody(data: unknown): unknown {
  return JSON.parse((data as string) ?? '{}');
}

describe('managementService', () => {
  describe('getSubAccounts', () => {
    it('maps the raw DB rows into the console SubAccount shape', async () => {
      let seenConfig: { url?: string; params?: unknown } | undefined;
      managementAxios.defaults.adapter = mockAdapter((config) => {
        seenConfig = config;
        return {
          status: 200,
          data: {
            items: [
              {
                id: 'sa-1',
                email: 'client@internxt.com',
                partnerId: 'p1',
                partnerName: 'Acme',
                status: 'ACTIVE',
                activeStorageBytes: 1_000_000_000_000,
                deletedStorageBytes: 500_000_000_000,
                createdAt: '2024-01-01T00:00:00.000Z',
                customerId: 'cus_1',
              },
            ],
            total: 1,
          },
        };
      });

      const result = await managementService.getSubAccounts({ page: 1, perPage: 20 });

      expect(seenConfig?.url).toBe('/management/sub-accounts');
      expect(seenConfig?.params).toEqual({ page: 1, perPage: 20 });
      expect(result.total).toBe(1);
      expect(result.subAccounts[0]).toMatchObject({
        id: 'sa-1',
        email: 'client@internxt.com',
        partnerId: 'p1',
        partnerName: 'Acme',
        status: 'PAID_ACCOUNT',
        activeStorage: 1,
        deletedStorage: 0.5,
        customerId: 'cus_1',
      });
    });

    it('accepts a bare array response (no pagination envelope)', async () => {
      managementAxios.defaults.adapter = mockAdapter(() => ({
        status: 200,
        data: [{ id: 'sa-1', email: 'a@b.com', status: 'DELETED', activeStorageBytes: 0, deletedStorageBytes: 0, createdAt: '' }],
      }));

      const result = await managementService.getSubAccounts({});

      expect(result.total).toBe(1);
      expect(result.subAccounts[0].status).toBe('DELETED');
    });
  });

  it('createSubAccount posts the new sub-account', async () => {
    let seenConfig: { url?: string; data?: string } | undefined;
    managementAxios.defaults.adapter = mockAdapter((config) => {
      seenConfig = config;
      return { status: 200 };
    });

    await managementService.createSubAccount({
      name: 'Acme',
      email: 'acme@internxt.com',
      password: 'secret',
      country: 'ES',
      postalCode: '08001',
    });

    expect(seenConfig?.url).toBe('/management/sub-accounts');
    expect(parseBody(seenConfig?.data)).toEqual({
      name: 'Acme',
      email: 'acme@internxt.com',
      password: 'secret',
      country: 'ES',
      postalCode: '08001',
    });
  });

  it('suspendSubAccount PUTs the suspend endpoint', async () => {
    let seenConfig: { url?: string; method?: string } | undefined;
    managementAxios.defaults.adapter = mockAdapter((config) => {
      seenConfig = config;
      return { status: 200 };
    });

    await managementService.suspendSubAccount('sa-1');

    expect(seenConfig?.url).toBe('/management/sub-accounts/sa-1/suspend');
  });

  it('reactivateSubAccount PUTs the reactivate endpoint', async () => {
    let seenConfig: { url?: string } | undefined;
    managementAxios.defaults.adapter = mockAdapter((config) => {
      seenConfig = config;
      return { status: 200 };
    });

    await managementService.reactivateSubAccount('sa-1');

    expect(seenConfig?.url).toBe('/management/sub-accounts/sa-1/reactivate');
  });

  describe('getUsagesSummary', () => {
    it('returns the mapped summary', async () => {
      managementAxios.defaults.adapter = mockAdapter(() => ({
        status: 200,
        data: {
          usedBillableStorageTb: 10,
          totalReservedCapacityTB: 100,
          remainingCapacityTB: 90,
          momGrowthPercent: 5,
        },
      }));

      const result = await managementService.getUsagesSummary();

      expect(result).toEqual({
        usedBillableStorageTb: 10,
        totalReservedCapacityTB: 100,
        remainingCapacityTB: 90,
        momGrowthPercent: 5,
      });
    });

    it('returns null when the backend returns no data', async () => {
      managementAxios.defaults.adapter = mockAdapter(() => ({ status: 200, data: null }));

      const result = await managementService.getUsagesSummary();

      expect(result).toBeNull();
    });
  });

  it('updateSubAccount PATCHes the sub-account with the given fields', async () => {
    let seenConfig: { url?: string; data?: string } | undefined;
    managementAxios.defaults.adapter = mockAdapter((config) => {
      seenConfig = config;
      return { status: 200 };
    });

    await managementService.updateSubAccount('sa-1', { name: 'New name' });

    expect(seenConfig?.url).toBe('/management/sub-accounts/sa-1');
    expect(parseBody(seenConfig?.data)).toEqual({ name: 'New name' });
  });

  it('getSubAccountById fetches the sub-account detail', async () => {
    let seenConfig: { url?: string } | undefined;
    managementAxios.defaults.adapter = mockAdapter((config) => {
      seenConfig = config;
      return { status: 200, data: { id: 'sa-1' } };
    });

    const result = await managementService.getSubAccountById('sa-1');

    expect(seenConfig?.url).toBe('/management/sub-accounts/sa-1');
    expect(result).toEqual({ id: 'sa-1' });
  });

  it('getSubAccountUsages fetches the usages page with pagination fallback', async () => {
    let seenConfig: { url?: string; params?: unknown } | undefined;
    managementAxios.defaults.adapter = mockAdapter((config) => {
      seenConfig = config;
      return { status: 200, data: { items: [{ id: 1 }, { id: 2 }] } };
    });

    const result = await managementService.getSubAccountUsages('sa-1', { from: '2024-01-01', to: '2024-01-31' });

    expect(seenConfig?.url).toBe('/management/sub-accounts/sa-1/usages');
    expect(seenConfig?.params).toEqual({ from: '2024-01-01', to: '2024-01-31' });
    expect(result).toEqual({ items: [{ id: 1 }, { id: 2 }], totalItems: 2 });
  });

  it('getInvoices fetches invoices with the given filters', async () => {
    let seenConfig: { url?: string; params?: unknown } | undefined;
    managementAxios.defaults.adapter = mockAdapter((config) => {
      seenConfig = config;
      return { status: 200, data: { items: [] } };
    });

    await managementService.getInvoices({ page: 2, perPage: 10 });

    expect(seenConfig?.url).toBe('/management/invoices');
    expect(seenConfig?.params).toEqual({ page: 2, perPage: 10 });
  });

  it('getBuckets fetches buckets with the given filters', async () => {
    let seenConfig: { url?: string; params?: unknown } | undefined;
    managementAxios.defaults.adapter = mockAdapter((config) => {
      seenConfig = config;
      return { status: 200, data: { items: [] } };
    });

    await managementService.getBuckets({ name: 'my-bucket', region: 'eu-central-1' });

    expect(seenConfig?.url).toBe('/management/buckets');
    expect(seenConfig?.params).toEqual({ name: 'my-bucket', region: 'eu-central-1' });
  });
});
