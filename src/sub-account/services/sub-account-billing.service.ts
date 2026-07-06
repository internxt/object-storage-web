import subAccountAxios from '../core/sub-account-axios';

async function createBillingPortalSession(entityId: string): Promise<{ url: string }> {
  const response = await subAccountAxios.post<{ url: string }>(
    `/sub-accounts/${entityId}/billing-portal`,
    { returnUrl: window.location.href },
  );
  return response.data;
}

export const subAccountBillingService = {
  createBillingPortalSession,
};
