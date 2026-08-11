import axios from 'axios';

export const apiErrorMessage = (err: unknown, fallback: string): string =>
  (axios.isAxiosError(err) ? err.response?.data?.message : undefined) ?? fallback;
