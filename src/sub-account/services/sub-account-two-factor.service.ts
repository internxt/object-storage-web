import subAccountAxios from '../core/sub-account-axios';
import { subAccountAuthService } from './sub-account-auth.service';

export interface TwoFactorStatus {
  enabled: boolean;
  ssoEnabled: boolean;
}

export interface TwoFactorSetup {
  secret: string;
  qrCode: string;
}

export const subAccountTwoFactorService = {
  getStatus: async (): Promise<TwoFactorStatus> => {
    const response = await subAccountAxios.get<TwoFactorStatus>('/subaccount/me/two-factor');
    return response.data;
  },
  getSetup: async (): Promise<TwoFactorSetup> => {
    const response = await subAccountAxios.get<TwoFactorSetup>('/subaccount/me/two-factor/setup');
    return response.data;
  },
  enable: async (code: string): Promise<void> => {
    const { data } = await subAccountAxios.post<{ token: string }>('/subaccount/me/two-factor/enable', { code });
    subAccountAuthService.setToken(data.token);
  },
  disable: async (password: string, code: string): Promise<void> => {
    const { data } = await subAccountAxios.post<{ token: string }>('/subaccount/me/two-factor/disable', {
      password,
      code,
    });
    subAccountAuthService.setToken(data.token);
  },
};
