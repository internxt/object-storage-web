import axios, { AxiosRequestConfig } from 'axios'
import { localStorageService } from './localStorage.service'
import sizeService from './size.service'

export interface Usage {
  id: string
  downloads: number
  uploads: number
  recordDate: string
  totalUsage: number
}

const getUsage = async (from: string, to: string): Promise<Usage[]> => {
  const token = localStorageService.getUserToken()

  const config: AxiosRequestConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params: {
      from,
      to,
    },
  }

  const usageResponse = await axios.get(
    `${import.meta.env.VITE_OBJECT_STORAGE_API_URL}/users/usage`,
    config
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
