import { describe, expect, it } from 'vitest';
import { brandingService } from './branding.service';
import partnersAxios from '../core/partners-axios';
import { mockAdapter } from '../../testing/mock-axios-adapter';

describe('brandingService', () => {
  it('getBranding fetches the current branding', async () => {
    let seenConfig: { url?: string } | undefined;
    partnersAxios.defaults.adapter = mockAdapter((config) => {
      seenConfig = config;
      return { status: 200, data: { logoUrl: 'https://x/logo.png', primaryColor: '#000', consoleHostname: null } };
    });

    const result = await brandingService.getBranding();

    expect(seenConfig?.url).toBe('/branding');
    expect(result).toEqual({ logoUrl: 'https://x/logo.png', primaryColor: '#000', consoleHostname: null });
  });

  it('updateBranding PATCHes the branding and returns the saved value', async () => {
    let seenConfig: { url?: string; data?: string } | undefined;
    partnersAxios.defaults.adapter = mockAdapter((config) => {
      seenConfig = config;
      return { status: 200, data: { logoUrl: null, primaryColor: '#fff', consoleHostname: 'partner.internxt.com' } };
    });

    const result = await brandingService.updateBranding({
      logoUrl: null,
      primaryColor: '#fff',
      consoleHostname: 'partner.internxt.com',
    });

    expect(seenConfig?.url).toBe('/branding');
    expect(JSON.parse(seenConfig?.data ?? '{}')).toEqual({
      logoUrl: null,
      primaryColor: '#fff',
      consoleHostname: 'partner.internxt.com',
    });
    expect(result).toEqual({ logoUrl: null, primaryColor: '#fff', consoleHostname: 'partner.internxt.com' });
  });
});
