import { createHttpClient, HttpClient } from './client';
import { API_CONFIG } from '@/constants/api';

export const httpClient: HttpClient = createHttpClient({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: API_CONFIG.DEFAULT_HEADERS,
});

export { createHttpClient } from './client';
export type { ApiConfig, ApiResponse, ApiError } from './client';
