import { describe, expect, test } from 'vitest';
import { loadWholesalerPartner } from './useWholesalerPartner';
import wholesalersAxios from '../core/wholesalers-axios';
import { mockAdapter, MockResult } from '../../testing/mock-axios-adapter';
import { WholesalerPartnerDetail } from '../services/wholesalers.service';

const partner: WholesalerPartnerDetail = {
  id: 'p1',
  name: 'Acme',
  email: 'a@acme.com',
  status: 'ACTIVE',
  createdAt: '2026-01-01',
};
const usage = { totalSubAccounts: 2, activeStorageTb: 1, deletedStorageTb: 0 };

function respond(routes: { partner?: MockResult; usage?: MockResult }): string[] {
  const seen: string[] = [];
  wholesalersAxios.defaults.adapter = mockAdapter((config) => {
    seen.push(config.url ?? '');
    if (config.url?.endsWith('/usages/summary')) return routes.usage ?? { status: 200, data: usage };
    return routes.partner ?? { status: 200, data: partner };
  });
  return seen;
}

describe('loadWholesalerPartner', () => {
  test('when no partner is known, then it fetches the partner and its usage', async () => {
    const seen = respond({});

    const result = await loadWholesalerPartner('p1');

    expect(seen).toEqual(['/wholesalers/partners/p1', '/wholesalers/partners/p1/usages/summary']);
    expect(result).toEqual({ kind: 'loaded', partner, usage });
  });

  test('when the partner is known, then it only fetches the usage', async () => {
    const seen = respond({});

    const result = await loadWholesalerPartner('p1', partner);

    expect(seen).toEqual(['/wholesalers/partners/p1/usages/summary']);
    expect(result).toEqual({ kind: 'loaded', partner, usage });
  });

  test('when the partner is deleted, then it is loaded with its deleted status', async () => {
    const deleted = { ...partner, status: 'DELETED' };
    respond({ partner: { status: 200, data: deleted } });

    const result = await loadWholesalerPartner('p1');

    expect(result).toEqual({ kind: 'loaded', partner: deleted, usage });
  });

  test.each([
    [400, 'a malformed id'],
    [403, 'a partner of another wholesaler'],
    [404, 'a missing partner'],
  ])('when the partner request answers %i (%s), then it is not found', async (status) => {
    respond({ partner: { status }, usage: { status: 500 } });

    const result = await loadWholesalerPartner('p1');

    expect(result).toEqual({ kind: 'notFound' });
  });

  test('when the partner request fails otherwise, then it returns the server message', async () => {
    respond({ partner: { status: 500, data: { message: 'Database unavailable' } } });

    const result = await loadWholesalerPartner('p1');

    expect(result).toEqual({ kind: 'error', message: 'Database unavailable' });
  });

  test('when only the usage request fails, then the partner is loaded with a usage error', async () => {
    respond({ usage: { status: 500, data: { message: 'Provider error' } } });

    const result = await loadWholesalerPartner('p1');

    expect(result).toEqual({ kind: 'loaded', partner, usage: null, usageError: 'Provider error' });
  });
});
