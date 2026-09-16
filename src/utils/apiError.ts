import axios from 'axios';

export const apiErrorMessage = (err: unknown, fallback: string): string => {
  const message = axios.isAxiosError(err) ? err.response?.data?.message : undefined;
  if (Array.isArray(message)) return message.join('. ');
  return typeof message === 'string' && message.length > 0 ? message : fallback;
};

export const hasApiErrorStatus = (err: unknown, status: number): boolean =>
  axios.isAxiosError(err) && err.response?.status === status;
