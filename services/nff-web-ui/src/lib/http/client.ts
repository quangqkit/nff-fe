import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";
import { tokenManager } from "../auth/token-manager";
import { toastService } from "@/services/toast";
import { AUTH_ROUTES } from "../auth/constants";

export interface ApiConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
  status: number;
}

export interface ApiError {
  message: string;
  status?: number;
  details?: Record<string, unknown>;
}

export class HttpClient {
  private instance: AxiosInstance;

  constructor(config: ApiConfig) {
    this.instance = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 10000,
      headers: {
        "Content-Type": "application/json",
        ...config.headers,
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.instance.interceptors.request.use(
      this.requestInterceptor.onFulfilled,
      this.requestInterceptor.onRejected
    );

    this.instance.interceptors.response.use(
      this.responseInterceptor.onFulfilled,
      this.responseInterceptor.onRejected
    );
  }

  private requestInterceptor = {
    onFulfilled: (
      config: InternalAxiosRequestConfig
    ): InternalAxiosRequestConfig => {
      const token = this.getAuthToken();

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    },
    onRejected: (error: AxiosError): Promise<AxiosError> => {
      return Promise.reject(error);
    },
  };

  private responseInterceptor = {
    onFulfilled: <T>(response: AxiosResponse<T>): AxiosResponse<T> => {
      return response;
    },
    onRejected: (error: AxiosError): Promise<AxiosError> => {
      const apiError = this.handleError(error);

      if (error.response?.status === 401) {
        this.handleUnauthorized();
      }

      toastService.error("Error", apiError.message);
      return Promise.reject(apiError);
    },
  };

  private getAuthToken(): string | null {
    return tokenManager.getAccessToken();
  }

  private handleUnauthorized(): void {
    tokenManager.clearTokens();
    window.location.href = AUTH_ROUTES.LOGIN;
  }

  private handleError(error: AxiosError): ApiError {
    const response = error.response;

    if (response?.data && typeof response.data === "object") {
      const data = response.data as any;
      return {
        message: data.message || data.error || "An unexpected error occurred",
        status: response.status,
        details: data.details,
      };
    }

    if (error.request) {
      return {
        message: "Network error. Please check your connection.",
        status: 0,
      };
    }

    return {
      message: error.message || "An unexpected error occurred",
      status: response?.status,
    };
  }

  async get<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.instance.get<T>(url, config);
    return this.transformResponse(response);
  }

  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.instance.post<T>(url, data, config);
    return this.transformResponse(response);
  }

  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.instance.put<T>(url, data, config);
    return this.transformResponse(response);
  }

  async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.instance.patch<T>(url, data, config);
    return this.transformResponse(response);
  }

  async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const response = await this.instance.delete<T>(url, config);
    return this.transformResponse(response);
  }

  private transformResponse<T>(response: AxiosResponse<T>): ApiResponse<T> {
    return {
      data: response.data,
      success: response.status >= 200 && response.status < 300,
      status: response.status,
    };
  }
}

export const createHttpClient = (config: ApiConfig): HttpClient => {
  return new HttpClient(config);
};
