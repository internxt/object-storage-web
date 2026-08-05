import axios from 'axios';

// Plain axios on purpose: these endpoints are public and must not send the
// member Bearer token nor trigger the 401 login redirect interceptor.
const baseURL = import.meta.env.VITE_OBJECT_STORAGE_API_URL;

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

export const publicShareService = {
  getMetadata: async (token: string): Promise<ShareMetadata> => {
    const response = await axios.get<ShareMetadata>(`${baseURL}/shares/${token}`);
    return response.data;
  },
  list: async (token: string, prefix?: string, cursor?: string): Promise<ShareListResponse> => {
    const response = await axios.get<ShareListResponse>(`${baseURL}/shares/${token}/list`, {
      params: { prefix, cursor },
    });
    return response.data;
  },
  download: async (token: string, key?: string): Promise<Blob> => {
    const response = await axios.get<Blob>(`${baseURL}/shares/${token}/download`, {
      params: { key },
      responseType: 'blob',
    });
    return response.data;
  },
};
