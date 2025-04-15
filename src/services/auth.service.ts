import axios from 'axios'
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

async function logOut() {
  localStorageService.removeUserToken()
}

export const authService = {
  logIn,
  logOut,
}
