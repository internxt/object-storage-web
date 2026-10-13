import axios, { AxiosInstance } from 'axios';
import subAccountAxios from '../sub-account/core/sub-account-axios';

export interface ShareBranding {
  logoUrl: string | null;
  primaryColor: string | null;
}

export interface ShareMetadata {
  type: 'file' | 'folder';
  name: string;
  bucket?: string;
  prefix?: string;
  branding?: ShareBranding;
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

export interface ShareDataSource {
  getMetadata: (token: string) => Promise<ShareMetadata>;
  list: (token: string, prefix?: string, cursor?: string) => Promise<ShareListResponse>;
  download: (token: string, key?: string) => Promise<string>;
  preview: (token: string, key?: string) => Promise<{ url: string; contentType: string }>;
}

const publicAxios = axios.create({
  baseURL: import.meta.env.VITE_OBJECT_STORAGE_API_URL,
});

const createShareDataSource = (client: AxiosInstance, basePath: string): ShareDataSource => ({
  getMetadata: async (token) => {
    const response = await client.get<ShareMetadata>(`${basePath}/${token}`);
    return response.data;
  },
  list: async (token, prefix, cursor) => {
    const response = await client.get<ShareListResponse>(`${basePath}/${token}/list`, {
      params: { prefix, cursor },
    });
    return response.data;
  },
  download: async (token, key) => {
    const response = await client.get<{ url: string }>(`${basePath}/${token}/download`, {
      params: { key },
    });
    return response.data.url;
  },
  preview: async (token, key) => {
    const response = await client.get<{ url: string; contentType: string }>(`${basePath}/${token}/preview`, {
      params: { key },
    });
    return response.data;
  },
});

export const shareService = createShareDataSource(subAccountAxios, '/shares');

export const publicShareService = createShareDataSource(publicAxios, '/public/shares');
