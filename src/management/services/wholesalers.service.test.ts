import { describe, expect, test } from 'vitest';
import { wholesalersService } from './wholesalers.service';
import managementAxios from '../core/management-axios';
import { mockAdapter } from '../../testing/mock-axios-adapter';

function parseBody(data: unknown): unknown {
  return JSON.parse((data as string) ?? '{}');
}

describe('management wholesalersService', () => {
  test('when createWholesaler is called, then it posts the new wholesaler', async () => {
    let seenConfig: { url?: string; data?: string } | undefined;
    managementAxios.defaults.adapter = mockAdapter((config) => {
      seenConfig = config;
      return { status: 200 };
    });

    await wholesalersService.createWholesaler({
      name: 'Acme',
      email: 'acme@internxt.com',
      password: 'secret',
      country: 'ES',
      postalCode: '08001',
    });

    expect(seenConfig?.url).toBe('/management/wholesalers');
    expect(parseBody(seenConfig?.data)).toEqual({
      name: 'Acme',
      email: 'acme@internxt.com',
      password: 'secret',
      country: 'ES',
      postalCode: '08001',
    });
  });

  describe('getWholesalers', () => {
    test('when the backend returns a pagination envelope, then it maps the raw rows into the Wholesaler shape', async () => {
      let seenConfig: { url?: string; params?: unknown } | undefined;
      managementAxios.defaults.adapter = mockAdapter((config) => {
        seenConfig = config;
        return {
          status: 200,
          data: {
            items: [{ id: 'w1', name: 'Acme', email: 'a@b.com', customerId: 'cus_1', partnersCount: 3, activeStorageTb: 4.2 }],
            total: 1,
          },
        };
      });

      const result = await wholesalersService.getWholesalers({ page: 1, perPage: 20 });

      expect(seenConfig?.url).toBe('/management/wholesalers');
      expect(seenConfig?.params).toEqual({ page: 1, perPage: 20 });
      expect(result).toEqual({
        total: 1,
        wholesalers: [
          { id: 'w1', name: 'Acme', email: 'a@b.com', customerId: 'cus_1', partnersCount: 3, activeStorageTb: 4.2, createdAt: '' },
        ],
      });
    });

    test('when the backend returns no rows, then it defaults to an empty list', async () => {
      managementAxios.defaults.adapter = mockAdapter(() => ({ status: 200, data: {} }));

      const result = await wholesalersService.getWholesalers({});

      expect(result).toEqual({ total: 0, wholesalers: [] });
    });
  });
});
