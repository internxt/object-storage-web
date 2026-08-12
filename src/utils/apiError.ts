import axios from 'axios';

export const apiErrorMessage = (err: unknown, fallback: string): string =>
  (axios.isAxiosError(err) ? err.response?.data?.message : undefined) ?? fallback;

export const hasApiErrorStatus = (err: unknown, status: number): boolean =>
  axios.isAxiosError(err) && err.response?.status === status;
