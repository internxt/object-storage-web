import managementAxios from '../core/management-axios';
import { managementAuthService } from './management-auth.service';

const BASE = '/management/me/two-factor';

export interface TwoFactorStatus {
  enabled: boolean;
}

export interface TwoFactorSetup {
  secret: string;
  qrCode: string;
}

export const managementTwoFactorService = {
  getStatus: async (): Promise<TwoFactorStatus> => {
    const response = await managementAxios.get<TwoFactorStatus>(BASE);
    return response.data;
  },
  getSetup: async (): Promise<TwoFactorSetup> => {
    const response = await managementAxios.get<TwoFactorSetup>(`${BASE}/setup`);
    return response.data;
  },
  enable: async (code: string): Promise<void> => {
    const { data } = await managementAxios.post<{ token: string }>(`${BASE}/enable`, { code });
    managementAuthService.setToken(data.token);
  },
  disable: async (password: string, code: string): Promise<void> => {
    const { data } = await managementAxios.post<{ token: string }>(`${BASE}/disable`, { password, code });
    managementAuthService.setToken(data.token);
  },
};
