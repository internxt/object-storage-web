import { AxiosHeaders, AxiosRequestConfig, AxiosResponse } from 'axios';

export interface MockResult {
  status: number;
  data?: unknown;
}

/**
 * A fake axios adapter: lets tests exercise a real axios instance (request/response
 * interceptors included) end to end, without any real network I/O.
 */
export function mockAdapter(responder: (config: AxiosRequestConfig) => MockResult) {
  return async (config: AxiosRequestConfig): Promise<AxiosResponse> => {
    const result = responder(config);
    // Only default to `{}` when `data` was left out entirely, an explicit
    // `data: null`/`undefined` is a deliberate "empty body" the test wants preserved.
    const data = 'data' in result ? result.data : {};
    if (result.status >= 200 && result.status < 300) {
      return {
        data,
        status: result.status,
        statusText: '',
        headers: new AxiosHeaders(),
        config: config as AxiosResponse['config'],
      };
    }
    const error = new Error(`Request failed with status code ${result.status}`) as Error & {
      isAxiosError: boolean;
      config: AxiosRequestConfig;
      response: AxiosResponse;
    };
    error.isAxiosError = true;
    error.config = config;
    error.response = {
      data,
      status: result.status,
      statusText: '',
      headers: new AxiosHeaders(),
      config: config as AxiosResponse['config'],
    };
    throw error;
  };
}
