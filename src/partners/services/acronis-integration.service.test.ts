import { describe, expect, test } from 'vitest';
import { acronisIntegrationService } from './acronis-integration.service';
import partnersAxios from '../core/partners-axios';
import { mockAdapter } from '../../testing/mock-axios-adapter';

describe('acronisIntegrationService', () => {
  test('when getStatus is called, then it fetches the current connection status', async () => {
    let seenConfig: { url?: string; method?: string } | undefined;
    partnersAxios.defaults.adapter = mockAdapter((config) => {
      seenConfig = config;
      return { status: 200, data: { connected: true, createdAt: '2026-01-01T00:00:00.000Z' } };
    });

    const result = await acronisIntegrationService.getStatus();

    expect(seenConfig?.url).toBe('/partners/acronis-integration/api-key');
    expect(seenConfig?.method).toBe('get');
    expect(result).toEqual({ connected: true, createdAt: '2026-01-01T00:00:00.000Z' });
  });

  test('when generateApiKey is called, then it POSTs and returns the newly generated key', async () => {
    let seenConfig: { url?: string; method?: string } | undefined;
    partnersAxios.defaults.adapter = mockAdapter((config) => {
      seenConfig = config;
      return { status: 201, data: { apiKey: 'iak_generated-key' } };
    });

    const result = await acronisIntegrationService.generateApiKey();

    expect(seenConfig?.url).toBe('/partners/acronis-integration/api-key');
    expect(seenConfig?.method).toBe('post');
    expect(result).toEqual({ apiKey: 'iak_generated-key' });
  });

  test('when revokeApiKey is called, then it DELETEs the current key', async () => {
    let seenConfig: { url?: string; method?: string } | undefined;
    partnersAxios.defaults.adapter = mockAdapter((config) => {
      seenConfig = config;
      return { status: 204, data: undefined };
    });

    await acronisIntegrationService.revokeApiKey();

    expect(seenConfig?.url).toBe('/partners/acronis-integration/api-key');
    expect(seenConfig?.method).toBe('delete');
  });
});
