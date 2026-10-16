import subAccountAxios from '../core/sub-account-axios';

export interface SubAccountSettings {
  publicSharingEnabled: boolean;
}

export const subAccountSettingsService = {
  getSettings: async (entityId: string): Promise<SubAccountSettings> => {
    const response = await subAccountAxios.get<SubAccountSettings>(`/sub-accounts/${entityId}/settings`);
    return response.data;
  },
  updateSettings: async (
    entityId: string,
    body: { publicSharingEnabled?: boolean },
  ): Promise<SubAccountSettings> => {
    const response = await subAccountAxios.patch<SubAccountSettings>(`/sub-accounts/${entityId}/settings`, body);
    return response.data;
  },
};
