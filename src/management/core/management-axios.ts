import axios from 'axios';
import { managementAuthService } from '../services/management-auth.service';
import notificationsService from '../../services/notifications.service';

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
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.endsWith('/login')) {
      managementAuthService.logOut();
      notificationsService.error({ text: 'Session expired. Please log in again.' });
      window.location.href = '/management/login';
    }
    return Promise.reject(error);
  },
);

export default managementAxios;
