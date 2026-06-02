import axios from 'axios';
import { subAccountAuthService } from '../services/sub-account-auth.service';

const subAccountAxios = axios.create({
  baseURL: import.meta.env.VITE_OBJECT_STORAGE_API_URL,
});

subAccountAxios.interceptors.request.use((config) => {
  const token = subAccountAuthService.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

subAccountAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log('[sub-account] axios error', { status: error.response?.status, url: error.config?.url });
    if (error.response?.status === 401) {
      console.log('[sub-account] 401 → redirecting to login');
      // subAccountAuthService.logOut();
      // window.location.href = '/subaccount/login';
    }
    return Promise.reject(error);
  },
);

export default subAccountAxios;
