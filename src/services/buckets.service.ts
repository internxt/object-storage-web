import axios, { AxiosRequestConfig } from 'axios'
import { localStorageService } from './localStorage.service'

export interface Bucket {
  id: string
  name: string
  region: string
  creationDate: Date
}

const getBuckets = async (): Promise<Bucket[]> => {
  const userToken = localStorageService.getUserToken()
  const config: AxiosRequestConfig = {
    headers: {
      Authorization: `Bearer ${userToken}`,
    },
  }

  const bucketsResponse = await axios.get(
    `${import.meta.env.VITE_OBJECT_STORAGE_API_URL}/users/buckets`,
    config
  )

  const buckets = bucketsResponse.data.map((bucket: Bucket) => ({
    ...bucket,
    id: crypto.randomUUID(),
  }))

  console.log(buckets)

  return buckets
}

export const bucketsService = {
  getBuckets,
}
