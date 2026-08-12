import subAccountAxios from '../sub-account/core/sub-account-axios';

export interface ShareMetadata {
  type: 'file' | 'folder';
  name: string;
  bucket: string;
  prefix?: string;
}

export interface ShareListItem {
  key: string;
  size: number;
  lastModified: string | null;
  isFolder: boolean;
}

export interface ShareListResponse {
  objects: ShareListItem[];
  nextCursor: string | null;
}

export const shareService = {
  getMetadata: async (token: string): Promise<ShareMetadata> => {
    const response = await subAccountAxios.get<ShareMetadata>(`/shares/${token}`);
    return response.data;
  },
  list: async (token: string, prefix?: string, cursor?: string): Promise<ShareListResponse> => {
    const response = await subAccountAxios.get<ShareListResponse>(`/shares/${token}/list`, {
      params: { prefix, cursor },
    });
    return response.data;
  },
  download: async (token: string, key?: string): Promise<string> => {
    const response = await subAccountAxios.get<{ url: string }>(`/shares/${token}/download`, {
      params: { key },
    });
    return response.data.url;
  },
};
