import partnersAxios from '../core/partners-axios';

const API = '/partners/acronis-integration/api-key';

export type AcronisIntegrationStatus = {
  connected: boolean;
  createdAt: string | null;
};

async function getStatus(): Promise<AcronisIntegrationStatus> {
  const response = await partnersAxios.get<AcronisIntegrationStatus>(API);
  return response.data;
}

async function generateApiKey(): Promise<{ apiKey: string }> {
  const response = await partnersAxios.post<{ apiKey: string }>(API);
  return response.data;
}

async function revokeApiKey(): Promise<void> {
  await partnersAxios.delete(API);
}

export const acronisIntegrationService = {
  getStatus,
  generateApiKey,
  revokeApiKey,
};
