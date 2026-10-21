import partnersAxios from '../core/partners-axios';

const API = '/branding';

export type Branding = {
  logoUrl: string | null;
  primaryColor: string | null;
  consoleHostname: string | null;
}
async function getBranding(): Promise<Branding> {
  const response = await partnersAxios.get<Branding>(API);
  return response.data;
}

async function updateBranding(branding: Branding): Promise<Branding> {
  const response = await partnersAxios.patch<Branding>(API, branding);
  return response.data;
}

export const brandingService = {
  getBranding,
  updateBranding,
};
