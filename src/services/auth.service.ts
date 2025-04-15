import axios from 'axios'
import { localStorageService } from './localStorage.service'

export class AuthService {
  private static instance: AuthService

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  async logIn(email: string, password: string): Promise<{ token: string }> {
    const logInResponse = await axios.post(
      `${import.meta.env.VITE_OBJECT_STORAGE_API_URL}/users/signin`,
      {
        email,
        password,
      }
    )

    return logInResponse.data
  }

  public clearToken(): void {
    localStorageService.removeUserToken()
  }
}
