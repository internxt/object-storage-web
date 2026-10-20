import axios from 'axios';
import { partnersAuthService } from '../services/partners-auth.service';
import notificationsService from '../../services/notifications.service';

const partnersAxios = axios.create({
  baseURL: import.meta.env.VITE_OBJECT_STORAGE_API_URL,
});

partnersAxios.interceptors.request.use((config) => {
  const token = partnersAuthService.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

partnersAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.endsWith('/login')) {
      partnersAuthService.logOut();
      notificationsService.error({ text: 'Session expired. Please log in again.' });
      window.location.href = '/partners/login';
    }
    return Promise.reject(error);
  },
);

export default partnersAxios;
