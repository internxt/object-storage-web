import httpClient from '../core/config/axios';

export interface S3Credentials {
  accessKeyId: string;
  secretAccessKey: string;
  endpoint: string;
  region: string;
}

export const s3CredentialsService = {
  getCredentials: async (): Promise<S3Credentials> => {
    const response = await httpClient.get<S3Credentials>('/users/s3-credentials');
    return response.data;
  },
};
