import axios from 'axios'
import { localStorageService } from '../../services/localStorage.service'

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_OBJECT_STORAGE_API_URL,
})

axiosInstance.interceptors.request.use((config) => {
  const token = localStorageService.getUserToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorageService.removeUserToken()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default axiosInstance
