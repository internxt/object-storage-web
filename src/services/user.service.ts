import axios, { AxiosRequestConfig } from 'axios'
import { localStorageService } from './localStorage.service'

export interface User {
  email: string
  id: string
  usage: number
}

const getUserData = async (): Promise<User> => {
  const token = localStorageService.getUserToken()

  const config: AxiosRequestConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
  const userDataResponse = await axios.get(
    `${import.meta.env.VITE_OBJECT_STORAGE_API_URL}/users/account`,
    config
  )

  return userDataResponse.data
}

export const userService = {
  getUserData,
}
