import axios, { AxiosRequestConfig } from 'axios'
import { localStorageService } from './localStorage.service'

type RegionBucket = 'eu-ie' | 'us-va'

export interface Bucket {
  id: string
  name: string
  region: RegionBucket
  creationDate: Date
}

export interface Region {
  createdAt: string
  enabled: boolean
  id: string
  region: RegionBucket
  storageDns: string
  updatedAt: string
  userId: string
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

  return buckets
}

const createBucket = async (name: Bucket['name'], region: Bucket['region']) => {
  const userToken = localStorageService.getUserToken()
  const config: AxiosRequestConfig = {
    headers: {
      Authorization: `Bearer ${userToken}`,
      'Content-Type': 'application/json',
    },
  }

  return axios.post(
    `${import.meta.env.VITE_OBJECT_STORAGE_API_URL}/users/buckets`,
    {
      name,
      region,
    },
    config
  )
}

const deleteBucket = (bucketName: Bucket['name'], region: Bucket['region']) => {
  const userToken = localStorageService.getUserToken()
  const config: AxiosRequestConfig = {
    headers: {
      Authorization: `Bearer ${userToken}`,
    },
  }

  return axios.delete(
    `${
      import.meta.env.VITE_OBJECT_STORAGE_API_URL
    }/users/buckets/${bucketName}?region=${region}`,
    config
  )
}

const getRegions = async (): Promise<Region[]> => {
  const userToken = localStorageService.getUserToken()
  const config: AxiosRequestConfig = {
    headers: {
      Authorization: `Bearer ${userToken}`,
    },
  }

  const regions = await axios.get(
    `${import.meta.env.VITE_OBJECT_STORAGE_API_URL}/users/regions`,

    config
  )

  return regions.data
}

export const bucketsService = {
  getBuckets,
  createBucket,
  deleteBucket,
  getRegions,
}
