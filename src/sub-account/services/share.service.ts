import subAccountAxios from '../core/sub-account-axios';

export interface CreateShareBody {
  bucket: string;
  key: string;
  isFolder: boolean;
  endpoint?: string;
  region?: string;
}

export interface CreateShareResponse {
  token: string;
}

export interface ShareListItem {
  id: string;
  bucket: string;
  objectKey: string;
  isFolder: boolean;
  createdAt: string;
  creator: string;
}

export const shareService = {
  createShare: async (entityId: string, body: CreateShareBody): Promise<CreateShareResponse> => {
    const response = await subAccountAxios.post<CreateShareResponse>(`/sub-accounts/${entityId}/shares`, body);
    return response.data;
  },
  listShares: async (entityId: string): Promise<ShareListItem[]> => {
    const response = await subAccountAxios.get<ShareListItem[]>(`/sub-accounts/${entityId}/shares`);
    return response.data;
  },
};
