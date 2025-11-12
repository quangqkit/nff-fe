import { ENV } from '@/config/env';

export const API_CONFIG = {
  BASE_URL: ENV.api.baseUrl,
  TIMEOUT: ENV.api.timeout,
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
  },
} as const;