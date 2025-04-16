import axios, { AxiosRequestConfig } from 'axios'
import { localStorageService } from './localStorage.service'

async function logIn(
  email: string,
  password: string
): Promise<{ token: string }> {
  const logInResponse = await axios.post(
    `${import.meta.env.VITE_OBJECT_STORAGE_API_URL}/users/signin`,
    {
      email,
      password,
    }
  )

  return logInResponse.data
}

const changePassword = async (newPassword: string): Promise<void> => {
  const userToken = localStorageService.getUserToken()

  const config: AxiosRequestConfig = {
    headers: {
      Authorization: `Bearer ${userToken}`,
    },
  }
  return axios.patch(
    `${import.meta.env.VITE_OBJECT_STORAGE_API_URL}/users/password`,
    {
      newPassword,
    },
    config
  )
}

async function logOut() {
  localStorageService.removeUserToken()
}

export const authService = {
  logIn,
  changePassword,
  logOut,
}
