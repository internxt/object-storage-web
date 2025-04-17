import axios, { AxiosRequestConfig } from 'axios'
import { localStorageService } from './localStorage.service'
import { RegionBucket } from './buckets.service'

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
  const userToken = localStorageService.getUserToken()
  const config: AxiosRequestConfig = {
    headers: {
      Authorization: `Bearer ${userToken}`,
    },
  }

  const accessKeysResponse = await axios.get(
    `${import.meta.env.VITE_OBJECT_STORAGE_API_URL}/users/access-keys`,
    config
  )

  return accessKeysResponse.data
}

const createAccessKey = async ({
  name,
  permission,
  region,
}: CreateAccessKeyPayload) => {
  const userToken = localStorageService.getUserToken()
  const config: AxiosRequestConfig = {
    headers: {
      Authorization: `Bearer ${userToken}`,
    },
  }

  const createdAccessKeysResponse = await axios.post(
    `${import.meta.env.VITE_OBJECT_STORAGE_API_URL}/users/access-keys`,
    {
      name,
      permission,
      region,
    },
    config
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
  const userToken = localStorageService.getUserToken()
  const config: AxiosRequestConfig = {
    headers: {
      Authorization: `Bearer ${userToken}`,
    },
  }

  return axios.post(
    `${import.meta.env.VITE_OBJECT_STORAGE_API_URL}/users/access-keys/remove`,
    {
      region,
      accessKeyId,
    },
    config
  )
}

export const accessKeysService = {
  getAccessKeys,
  createAccessKey,
  removeAccessKey,
}
