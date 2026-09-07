import subAccountAxios from '../core/sub-account-axios';

export type SubAccountBranding = {
  logoUrl: string | null;
  primaryColor: string | null;
};

async function getBrandingBySubAccountId(subAccountId: string): Promise<SubAccountBranding> {
  const response = await subAccountAxios.get<SubAccountBranding>(`/branding/sub-accounts/${subAccountId}`);
  return response.data;
}

async function getBrandingByHostname(hostname: string): Promise<SubAccountBranding> {
  const response = await subAccountAxios.get<SubAccountBranding>(`/branding/hostnames/${encodeURIComponent(hostname)}`);
  return response.data;
}

export const subAccountBrandingService = {
  getBrandingBySubAccountId,
  getBrandingByHostname,
};
