import { baseApi } from "@/lib/api/base";
import { useCallback, useRef, useState } from "react";

interface IndicatorConfig {
  chartType: string;
  dateRangeStart: string;
  dateRangeEnd: string;
}

interface IndicatorDataResponse {
  data: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor?: string;
      borderColor?: string;
      borderWidth?: number;
    }>;
  };
  metadata: {
    indicatorId: number;
    indicatorName: string;
    dateRange: {
      start: string;
      end: string;
    };
    lastUpdated: string;
  };
}

interface UseIndicatorConfigReturn {
  updateIndicatorConfig: (
    indicatorId: string,
    config: IndicatorConfig,
    blockId?: number
  ) => Promise<void>;
  getIndicatorConfig: (
    indicatorId: string,
    blockId?: number
  ) => Promise<IndicatorConfig>;
  getIndicatorData: (
    indicatorId: number,
    dateRangeOptions?: { dateRangeStart?: string; dateRangeEnd?: string }
  ) => Promise<IndicatorDataResponse>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useIndicatorConfig(): UseIndicatorConfigReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestCache = useRef<Map<string, Promise<IndicatorConfig>>>(new Map());

  const updateIndicatorConfig = useCallback(
    async (indicatorId: string, config: IndicatorConfig, blockId?: number) => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (blockId) {
          params.append("blockId", blockId.toString());
        }
        const url = `/reports/indicators/${indicatorId}/config${
          params.toString() ? `?${params.toString()}` : ""
        }`;
        await baseApi.put(url, config);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to update indicator config";
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getIndicatorConfig = useCallback(
    async (indicatorId: string, blockId?: number): Promise<IndicatorConfig> => {
      // Create cache key
      const cacheKey = `${indicatorId}-${blockId || "default"}`;

      // Check if request is already in progress
      if (requestCache.current.has(cacheKey)) {
        return requestCache.current.get(cacheKey)!;
      }

      setIsLoading(true);
      setError(null);

      const requestPromise = (async () => {
        try {
          const params = new URLSearchParams();
          if (blockId) {
            params.append("blockId", blockId.toString());
          }
          const url = `/reports/indicators/${indicatorId}/config${
            params.toString() ? `?${params.toString()}` : ""
          }`;
          const data = await baseApi.get(url);
          return data as IndicatorConfig;
        } catch (err) {
          const errorMessage =
            err instanceof Error
              ? err.message
              : "Failed to get indicator config";
          setError(errorMessage);
          throw err;
        } finally {
          setIsLoading(false);
          // Remove from cache after completion
          requestCache.current.delete(cacheKey);
        }
      })();

      // Cache the request
      requestCache.current.set(cacheKey, requestPromise);

      return requestPromise;
    },
    []
  );

  const getIndicatorData = useCallback(
    async (
      indicatorId: number,
      dateRangeOptions?: { dateRangeStart?: string; dateRangeEnd?: string }
    ): Promise<IndicatorDataResponse> => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (dateRangeOptions?.dateRangeStart) {
          params.append("dateRangeStart", dateRangeOptions.dateRangeStart);
        }
        if (dateRangeOptions?.dateRangeEnd) {
          params.append("dateRangeEnd", dateRangeOptions.dateRangeEnd);
        }

        const url = `/reports/indicators/${indicatorId}/data${
          params.toString() ? `?${params.toString()}` : ""
        }`;
        const data = await baseApi.get(url);
        return data as IndicatorDataResponse;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to get indicator data";
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    updateIndicatorConfig,
    getIndicatorConfig,
    getIndicatorData,
    isLoading,
    error,
    clearError,
  };
}
