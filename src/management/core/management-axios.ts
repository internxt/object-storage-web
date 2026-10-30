import axios, { InternalAxiosRequestConfig } from 'axios';
import { managementAuthService } from '../services/management-auth.service';
import notificationsService from '../../services/notifications.service';
import { isReauthRequiredError } from '../../utils/apiError';
import { markReauthCancelled, requestReauth } from './management-reauth';

type RetriableConfig = InternalAxiosRequestConfig & { _reauthRetried?: boolean };

const managementAxios = axios.create({
  baseURL: import.meta.env.VITE_OBJECT_STORAGE_API_URL,
});

managementAxios.interceptors.request.use((config) => {
  const token = managementAuthService.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

managementAxios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !window.location.pathname.endsWith('/login')) {
      managementAuthService.logOut();
      notificationsService.error({ text: 'Session expired. Please log in again.' });
      window.location.href = '/management/login';
    }

    const config = error.config as RetriableConfig | undefined;
    if (isReauthRequiredError(error) && config && !config._reauthRetried) {
      const confirmed = await requestReauth();
      if (!confirmed) {
        markReauthCancelled(error);
        throw error;
      }
      config._reauthRetried = true;
      return managementAxios(config);
    }

    return Promise.reject(error);
  },
);

export default managementAxios;
