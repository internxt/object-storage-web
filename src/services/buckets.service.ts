import axiosInstance from '../core/config/axios';

export interface Bucket {
  id: string;
  name: string;
  region: string;
  creationDate: Date;
}

export interface Region {
  createdAt: string;
  enabled: boolean;
  id: string;
  region: string;
  storageDns: string;
  updatedAt: string;
  userId: string;
}

export interface BucketUsageItem {
  id: number;
  startTime: string;
  endTime: string;
  activeStorage: number;
  deletedStorage: number;
  storageWrote: number;
  storageRead: number;
  activeObjects: number;
  deletedObjects: number;
  egress: number;
  ingress: number;
  apiCalls: number;
  name: string;
  region: string;
  bucketNumber: number;
  bucketDeleteTime: string | null;
}

export interface BucketUsageResponse {
  items: BucketUsageItem[];
  page: number;
  size: number;
  total: number;
}

const getBuckets = async (): Promise<Bucket[]> => {
  const bucketsResponse = await axiosInstance.get(
    `${import.meta.env.VITE_OBJECT_STORAGE_API_URL}/users/buckets`
  );

  const buckets = bucketsResponse.data.map((bucket: Bucket) => ({
    ...bucket,
    id: crypto.randomUUID(),
  }));

  return buckets;
};

const createBucket = async (name: Bucket['name'], region: Bucket['region']) => {
  return axiosInstance.post(
    `${import.meta.env.VITE_OBJECT_STORAGE_API_URL}/users/buckets`,
    {
      name,
      region,
    }
  );
};

const deleteBucket = (bucketName: Bucket['name'], region: Bucket['region']) => {
  return axiosInstance.delete(
    `${
      import.meta.env.VITE_OBJECT_STORAGE_API_URL
    }/users/buckets/${bucketName}?region=${region}`
  );
};

const getRegions = async (): Promise<Region[]> => {
  const regions = await axiosInstance.get(
    `${import.meta.env.VITE_OBJECT_STORAGE_API_URL}/users/regions`
  );

  return regions.data;
};

const getBucketUsage = async (
  startDate: Date,
  endDate: Date,
  _bucketName?: Bucket['name'],
  page?: number,
  perPage?: number
): Promise<BucketUsageResponse> => {
  const fromDate = startDate.toISOString();
  const toDate = endDate.toISOString();

  const response = await axiosInstance.get(
    `${import.meta.env.VITE_OBJECT_STORAGE_API_URL}/users/buckets/usages`,
    {
      params: {
        from: fromDate,
        to: toDate,
        ...(page !== undefined && { page }),
        ...(perPage !== undefined && { perPage }),
      },
    }
  );

  return response.data;
};

const getAllBucketUsage = async (
  startDate: Date,
  endDate: Date,
  bucketName?: Bucket['name'],
  onProgress?: (current: number, total: number, page: number) => void
): Promise<BucketUsageItem[]> => {
  let allItems: BucketUsageItem[] = [];
  let currentPage = 0;
  let hasMoreData = true;
  let totalItems = 0;

  while (hasMoreData) {
    const response = await getBucketUsage(
      startDate,
      endDate,
      bucketName,
      currentPage
    );

    allItems = [...allItems, ...response.items];
    totalItems = response.total;

    if (onProgress) {
      onProgress(allItems.length, totalItems, currentPage + 1);
    }

    const expectedTotal = response.total;
    hasMoreData = allItems.length < expectedTotal && response.items.length > 0;

    currentPage++;

    if (currentPage > 100) {
      console.warn('Pagination safety limit reached');
      break;
    }
  }

  return allItems;
};

export const bucketsService = {
  getBuckets,
  createBucket,
  deleteBucket,
  getRegions,
  getBucketUsage,
  getAllBucketUsage,
};
