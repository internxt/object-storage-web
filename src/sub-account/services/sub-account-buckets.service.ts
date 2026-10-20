import subAccountAxios from '../core/sub-account-axios';

export const subAccountBucketsService = {
  createBucket: async (
    entityId: string,
    memberId: string,
    name: string,
    region: string,
    objectLockEnabled?: boolean,
  ): Promise<{ name: string; region: string }> => {
    const response = await subAccountAxios.post<{ name: string; region: string }>(
      `/sub-accounts/${entityId}/members/${memberId}/buckets`,
      { name, region, objectLockEnabled },
    );
    return response.data;
  },
};
