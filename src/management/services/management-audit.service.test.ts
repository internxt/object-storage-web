import { describe, expect, test } from 'vitest';
import { managementAuditService } from './management-audit.service';
import managementAxios from '../core/management-axios';
import { mockAdapter } from '../../testing/mock-axios-adapter';

describe('managementAuditService', () => {
  test('when getAuditEvents is called, then it requests the page and returns items and total', async () => {
    const data = {
      total: 1,
      items: [
        {
          id: 'e1',
          actorEmail: 'owner@internxt.com',
          action: 'delete',
          entityType: 'partner',
          entityId: 'p1',
          entitySnapshot: { name: 'Acme' },
          status: 'completed',
          error: null,
          ip: '127.0.0.1',
          createdAt: '2026-10-28T10:00:00.000Z',
        },
      ],
    };
    let seenConfig: { url?: string; params?: unknown } | undefined;
    managementAxios.defaults.adapter = mockAdapter((config) => {
      seenConfig = config;
      return { status: 200, data };
    });

    await expect(managementAuditService.getAuditEvents({ page: 2, perPage: 50 })).resolves.toEqual(data);
    expect(seenConfig?.url).toBe('/management/audit-events');
    expect(seenConfig?.params).toEqual({ page: 2, perPage: 50 });
  });
});
