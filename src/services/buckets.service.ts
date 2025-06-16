import axiosInstance from '../core/config/axios';

export type RegionBucket = 'eu-ie' | 'us-va';

export interface Bucket {
  id: string;
  name: string;
  region: string;
  creationDate: Date;
  bucketNumber?: number;
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
  createdAt?: number;
}

export interface BucketUsageResponse {
  items: BucketUsageItem[];
  page: number;
  size: number;
  total: number;
}

const getBuckets = async (): Promise<Bucket[]> => {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 2);

  const usageResponse = await axiosInstance.get(
    `${import.meta.env.VITE_OBJECT_STORAGE_API_URL}/users/buckets/usages`,
    {
      params: {
        from: yesterday.toISOString(),
        to: today.toISOString(),
        perPage: 100,
      },
    }
  );

  const uniqueBuckets = new Map<string, Bucket>();

  usageResponse.data.items.forEach((item: BucketUsageItem) => {
    if (item.bucketDeleteTime !== null) {
      return;
    }

    const bucketKey = `${item.name}-${item.region}`;
    if (!uniqueBuckets.has(bucketKey)) {
      uniqueBuckets.set(bucketKey, {
        id: crypto.randomUUID(),
        name: item.name,
        region: item.region,
        creationDate: new Date(item.createdAt ?? Date.now()),
        bucketNumber: item.bucketNumber,
      });
    }
  });

  return Array.from(uniqueBuckets.values());
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
  bucketNumber?: number,
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
        ...(bucketNumber !== undefined && { bucketId: bucketNumber }),
      },
    }
  );

  return response.data;
};

const getAllBucketUsage = async (
  startDate: Date,
  endDate: Date,
  bucketNumber?: number,
  perPage?: number
): Promise<BucketUsageItem[]> => {
  let allItems: BucketUsageItem[] = [];
  let currentPage = 0;
  let hasMoreData = true;

  while (hasMoreData) {
    const response = await getBucketUsage(
      startDate,
      endDate,
      bucketNumber,
      currentPage,
      perPage ?? 50
    );

    allItems = [...allItems, ...response.items];

    const expectedTotal = response.total;
    hasMoreData = allItems.length < expectedTotal && response.items.length > 0;

    currentPage++;

    if (currentPage > 100) {
      break;
    }
  }

  return allItems;
};

const getBucketsFromUsage = async (): Promise<
  { bucketNumber: number; name: string; region: string }[]
> => {
  const today = new Date();
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);

  const allUsageData = await getAllBucketUsage(monthAgo, today);

  const uniqueBuckets = new Map<
    number,
    { bucketNumber: number; name: string; region: string }
  >();

  allUsageData.forEach((item) => {
    if (!uniqueBuckets.has(item.bucketNumber)) {
      uniqueBuckets.set(item.bucketNumber, {
        bucketNumber: item.bucketNumber,
        name: item.name,
        region: item.region,
      });
    }
  });

  return Array.from(uniqueBuckets.values());
};

export const bucketsService = {
  getBuckets,
  createBucket,
  deleteBucket,
  getRegions,
  getBucketUsage,
  getAllBucketUsage,
  getBucketsFromUsage,
};
