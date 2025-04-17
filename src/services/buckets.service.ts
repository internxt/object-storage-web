import axiosInstance from '../core/config/axios'

export type RegionBucket = 'eu-ie' | 'us-va'

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
  const bucketsResponse = await axiosInstance.get(
    `${import.meta.env.VITE_OBJECT_STORAGE_API_URL}/users/buckets`
  )

  const buckets = bucketsResponse.data.map((bucket: Bucket) => ({
    ...bucket,
    id: crypto.randomUUID(),
  }))

  return buckets
}

const createBucket = async (name: Bucket['name'], region: Bucket['region']) => {
  return axiosInstance.post(
    `${import.meta.env.VITE_OBJECT_STORAGE_API_URL}/users/buckets`,
    {
      name,
      region,
    }
  )
}

const deleteBucket = (bucketName: Bucket['name'], region: Bucket['region']) => {
  return axiosInstance.delete(
    `${
      import.meta.env.VITE_OBJECT_STORAGE_API_URL
    }/users/buckets/${bucketName}?region=${region}`
  )
}

const getRegions = async (): Promise<Region[]> => {
  const regions = await axiosInstance.get(
    `${import.meta.env.VITE_OBJECT_STORAGE_API_URL}/users/regions`
  )

  return regions.data
}

export const bucketsService = {
  getBuckets,
  createBucket,
  deleteBucket,
  getRegions,
}
