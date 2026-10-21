import axios from 'axios';
import { wholesalersAuthService } from '../services/wholesalers-auth.service';
import notificationsService from '../../services/notifications.service';

const wholesalersAxios = axios.create({
  baseURL: import.meta.env.VITE_OBJECT_STORAGE_API_URL,
});

wholesalersAxios.interceptors.request.use((config) => {
  const token = wholesalersAuthService.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

wholesalersAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.endsWith('/login')) {
      wholesalersAuthService.logOut();
      notificationsService.error({ text: 'Session expired. Please log in again.' });
      window.location.href = '/wholesalers/login';
    }
    return Promise.reject(error);
  },
);

export default wholesalersAxios;
