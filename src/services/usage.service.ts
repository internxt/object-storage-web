import sizeService from './size.service'
import axiosInstance from '../core/config/axios'

export interface Usage {
  id: string
  downloads: number
  uploads: number
  recordDate: string
  totalUsage: number
}

const getUsage = async (from: string, to: string): Promise<Usage[]> => {
  const usageResponse = await axiosInstance.get(
    `${import.meta.env.VITE_OBJECT_STORAGE_API_URL}/users/usage`,
    {
      params: {
        from,
        to,
      },
    }
  )

  const usage = usageResponse.data.map((usage: Usage) => ({
    id: crypto.randomUUID(),
    downloads: sizeService.bytesToString(usage.downloads),
    uploads: sizeService.bytesToString(usage.uploads),
    totalUsage: sizeService.bytesToString(usage.totalUsage),
    recordDate: new Date(usage.recordDate).toLocaleDateString(),
  }))

  return usage
}

export const usageService = {
  getUsage,
}
