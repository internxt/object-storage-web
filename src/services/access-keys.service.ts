import { RegionBucket } from './buckets.service'
import axiosInstance from '../core/config/axios'

export type AccessKeyPermission = 'read' | 'write' | 'read-write'

export interface AccessKey {
  name: string
  description: string
  region: RegionBucket
  accessKeyId: string
  secretAccessKey: string
  creationDate: Date
}

interface CreateAccessKeyPayload {
  name: string
  region: RegionBucket
  permission: AccessKeyPermission
}

const getAccessKeys = async (): Promise<AccessKey[]> => {
  const accessKeysResponse = await axiosInstance.get(
    `${import.meta.env.VITE_OBJECT_STORAGE_API_URL}/users/access-keys`
  )

  return accessKeysResponse.data
}

const createAccessKey = async ({
  name,
  permission,
  region,
}: CreateAccessKeyPayload) => {
  const createdAccessKeysResponse = await axiosInstance.post(
    `${import.meta.env.VITE_OBJECT_STORAGE_API_URL}/users/access-keys`,
    {
      name,
      permission,
      region,
    }
  )

  return createdAccessKeysResponse.data
}

const removeAccessKey = async ({
  region,
  accessKeyId,
}: {
  region: RegionBucket
  accessKeyId: string
}) => {
  return axiosInstance.post(
    `${import.meta.env.VITE_OBJECT_STORAGE_API_URL}/users/access-keys/remove`,
    {
      region,
      accessKeyId,
    }
  )
}

export const accessKeysService = {
  getAccessKeys,
  createAccessKey,
  removeAccessKey,
}
