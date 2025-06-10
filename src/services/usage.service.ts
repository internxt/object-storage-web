import axiosInstance from '../core/config/axios';

interface UsageResponseItem {
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
  subAccountId: string;
  subAccountName: string;
  subAccountEmail: string;
  channelAccountId: string;
  channelAccountName: string;
  channelAccountEmail: string;
  wasabiAccountNumber: number;
}

interface UsageResponse {
  items: UsageResponseItem[];
  total: number;
  page: number;
  size: number;
}

export interface Usage {
  id: string;
  recordDate: string;
  endTime: string;
  activeStorage: number;
  deletedStorage: number;
  activeObjects: number;
  deletedObjects: number;
  apiCalls: number;
  egress: number;
  ingress: number;
}

export interface UsageSummary {
  totalCapacity: number;
  usedCapacity: number;
  remainingCapacity: number;
  totalApiCalls: number;
  totalEgress: number;
  totalIngress: number;
}

const getUsagePage = async (
  from: string,
  to: string,
  page?: number,
  perPage?: number
): Promise<UsageResponse> => {
  const usageResponse = await axiosInstance.get<UsageResponse>(
    `${import.meta.env.VITE_OBJECT_STORAGE_API_URL}/users/usages`,
    {
      params: {
        from,
        to,
        ...(page !== undefined && { page }),
        ...(perPage !== undefined && { perPage }),
      },
    }
  );

  return usageResponse.data;
};

const getAllUsageData = async (
  from: string,
  to: string,
  perPage?: number
): Promise<UsageResponseItem[]> => {
  let allItems: UsageResponseItem[] = [];
  let currentPage = 0;
  let hasMoreData = true;

  while (hasMoreData) {
    const response = await getUsagePage(from, to, currentPage, perPage ?? 50);

    allItems = [...allItems, ...response.items];

    const expectedTotal = response.total;
    hasMoreData = allItems.length < expectedTotal && response.items.length > 0;

    currentPage++;

    // Safety break
    if (currentPage > 100) {
      break;
    }
  }

  return allItems;
};

const getUsage = async (
  from: string,
  to: string
): Promise<{ usage: Usage[]; summary: UsageSummary }> => {
  const allUsageItems = await getAllUsageData(from, to);

  const usage = allUsageItems.map((usage: UsageResponseItem) => ({
    id: crypto.randomUUID(),
    recordDate: new Date(usage.endTime).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }),
    endTime: usage.endTime,
    activeStorage: usage.activeStorage,
    deletedStorage: usage.deletedStorage,
    activeObjects: usage.activeObjects,
    deletedObjects: usage.deletedObjects,
    apiCalls: usage.apiCalls,
    egress: usage.egress,
    ingress: usage.ingress,
  }));

  usage.sort(
    (a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime()
  );

  const totalApiCalls = allUsageItems.reduce(
    (sum, item) => sum + item.apiCalls,
    0
  );
  const totalEgress = allUsageItems.reduce((sum, item) => sum + item.egress, 0);
  const totalIngress = allUsageItems.reduce(
    (sum, item) => sum + item.ingress,
    0
  );
  const usedCapacity = allUsageItems.reduce(
    (sum, item) => sum + item.activeStorage,
    0
  );

  const totalCapacity = 1;
  const remainingCapacity = totalCapacity * 1024 - usedCapacity;

  const summary: UsageSummary = {
    totalCapacity,
    usedCapacity,
    remainingCapacity,
    totalApiCalls,
    totalEgress,
    totalIngress,
  };

  return { usage, summary };
};

export const usageService = {
  getUsage,
  getUsagePage,
  getAllUsageData,
};
