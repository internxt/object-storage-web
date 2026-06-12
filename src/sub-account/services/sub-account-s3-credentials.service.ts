import subAccountAxios from '../core/sub-account-axios';

export interface S3Credentials {
  accessKeyId: string;
  secretAccessKey: string;
  endpoint: string;
  region: string;
}

export const subAccountS3CredentialsService = {
  getCredentials: async (entityId: string, memberId: string): Promise<S3Credentials> => {
    const response = await subAccountAxios.get<S3Credentials>(
      `/sub-accounts/${entityId}/members/${memberId}/s3-credentials`,
    );
    return response.data;
  },
};
