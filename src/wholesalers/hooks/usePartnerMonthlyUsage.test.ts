import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import dayjs from 'dayjs';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { usePartnerMonthlyUsage } from './usePartnerMonthlyUsage';
import { wholesalersService, PartnerMonthlyUsageChunk } from '../services/wholesalers.service';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type HookResult = ReturnType<typeof usePartnerMonthlyUsage>;

async function settle() {
  for (let i = 0; i < 10; i++) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  }
}

const cleanups: (() => void)[] = [];

async function renderUsageHook(partnerId = 'p1') {
  const result: { current: HookResult } = { current: undefined as unknown as HookResult };
  const Probe = () => {
    result.current = usePartnerMonthlyUsage(partnerId);
    return null;
  };
  const root = createRoot(document.createElement('div'));
  await act(async () => root.render(createElement(Probe)));
  cleanups.push(() => act(() => root.unmount()));
  await settle();
  return result;
}

function mockServer(lastMonth: string, firstMonth: string) {
  return vi
    .spyOn(wholesalersService, 'getPartnerMonthlyUsage')
    .mockImplementation(async (_id, params): Promise<PartnerMonthlyUsageChunk> => {
      const end = dayjs(`${params?.to ?? lastMonth}-01`);
      const start = end.subtract((params?.months ?? 3) - 1, 'month');
      const first = dayjs(`${firstMonth}-01`);
      const from = start.isBefore(first) ? first : start;
      const items = [];
      for (let m = from; !m.isAfter(end); m = m.add(1, 'month')) {
        items.push({ month: m.format('YYYY-MM'), activeStorageTb: 1 });
      }
      return { items, nextTo: from.isAfter(first) ? from.subtract(1, 'month').format('YYYY-MM') : null };
    });
}

const months = (result: { current: HookResult }) => result.current.items.map((item) => item.month);

describe('usePartnerMonthlyUsage', () => {
  afterEach(() => {
    cleanups.splice(0).forEach((cleanup) => cleanup());
    vi.restoreAllMocks();
  });

  test('when the partner has more than 12 months of history, then it loads the last 12 in chunks and stops', async () => {
    const spy = mockServer('2026-11', '2024-01');

    const result = await renderUsageHook();

    expect(spy.mock.calls.map(([, params]) => params)).toEqual([
      { to: undefined, months: 3 },
      { to: '2026-08', months: 3 },
      { to: '2026-05', months: 3 },
      { to: '2026-02', months: 3 },
    ]);
    expect(months(result)).toHaveLength(12);
    expect(months(result)[0]).toBe('2025-12');
    expect(months(result)[11]).toBe('2026-11');
    expect(result.current).toMatchObject({ loading: false, failed: false, hasOlderMonths: true });
  });

  test('when the server reports no older months, then it stops without filling 12 months', async () => {
    const spy = mockServer('2026-11', '2026-07');

    const result = await renderUsageHook();

    expect(spy).toHaveBeenCalledTimes(2);
    expect(months(result)).toEqual(['2026-07', '2026-08', '2026-09', '2026-10', '2026-11']);
    expect(result.current).toMatchObject({ loading: false, failed: false, hasOlderMonths: false });
  });

  test('when fewer months than a chunk remain, then it only requests the months left to reach 12', async () => {
    const spy = vi
      .spyOn(wholesalersService, 'getPartnerMonthlyUsage')
      .mockResolvedValueOnce({
        items: Array.from({ length: 10 }, (_, i) => ({
          month: `2026-${String(i + 1).padStart(2, '0')}`,
          activeStorageTb: 1,
        })),
        nextTo: '2025-12',
      })
      .mockResolvedValueOnce({
        items: [
          { month: '2025-11', activeStorageTb: 1 },
          { month: '2025-12', activeStorageTb: 1 },
        ],
        nextTo: '2025-10',
      });

    const result = await renderUsageHook();

    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy.mock.calls[1][1]).toEqual({ to: '2025-12', months: 2 });
    expect(months(result)).toHaveLength(12);
  });

  test('when a chunk comes back empty, then it stops even if the server sent a cursor', async () => {
    const spy = vi
      .spyOn(wholesalersService, 'getPartnerMonthlyUsage')
      .mockResolvedValue({ items: [], nextTo: '2026-08' });

    const result = await renderUsageHook();

    expect(spy).toHaveBeenCalledTimes(1);
    expect(result.current).toMatchObject({ items: [], loading: false, hasOlderMonths: false });
  });

  test('when a chunk fails, then it stops and retry resumes from the same cursor', async () => {
    const server = mockServer('2026-11', '2026-01');
    server.mockImplementationOnce(async () => ({
      items: [{ month: '2026-11', activeStorageTb: 1 }],
      nextTo: '2026-10',
    }));
    server.mockRejectedValueOnce(new Error('boom'));

    const result = await renderUsageHook();

    expect(server).toHaveBeenCalledTimes(2);
    expect(result.current).toMatchObject({ failed: true, loading: false });
    expect(months(result)).toEqual(['2026-11']);

    await act(async () => result.current.retry());
    await settle();

    expect(server.mock.calls[2][1]).toEqual({ to: '2026-10', months: 3 });
    expect(result.current).toMatchObject({ failed: false, loading: false, hasOlderMonths: false });
    expect(months(result)).toHaveLength(11);
    expect(months(result)[0]).toBe('2026-01');
  });
});
