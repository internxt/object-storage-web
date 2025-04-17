import axiosInstance from '../core/config/axios'

export interface User {
  email: string
  id: string
  usage: number
}

const getUserData = async (): Promise<User> => {
  const userDataResponse = await axiosInstance.get(
    `${import.meta.env.VITE_OBJECT_STORAGE_API_URL}/users/account`
  )

  return userDataResponse.data
}

export const userService = {
  getUserData,
}
