import { useState, useCallback } from "react";
import { useUpdateBlock } from "@/hooks/reports/useBlocks";
import { baseApi } from "@/lib/api/base";

interface ChartConfigData {
  position: string;
  config: string;
}

interface UseChartConfigReturn {
  updateChartConfig: (
    chartId: number,
    config: ChartConfigData
  ) => Promise<void>;
  getChartConfig: (chartId: number) => Promise<ChartConfigData | null>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useChartConfig(): UseChartConfigReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const updateBlockMutation = useUpdateBlock();

  const updateChartConfig = useCallback(
    async (chartId: number, config: ChartConfigData) => {
      setIsLoading(true);
      setError(null);

      try {
        await updateBlockMutation.mutateAsync({
          blockId: chartId,
          data: {
            content: {
              chartConfig: config as unknown as Record<string, unknown>,
            },
          },
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update chart config";
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [updateBlockMutation]
  );

  const getChartConfig = useCallback(async (chartId: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = (await baseApi.get(`/blocks/${chartId}`)) as Record<
        string,
        unknown
      >;
      const chartConfig = (data.content as Record<string, unknown>)
        ?.chartConfig as Record<string, unknown>;
      return {
        position: (chartConfig?.position as string) || "top",
        config: (chartConfig?.config as string) || "{}",
      };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to get chart config";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    updateChartConfig,
    getChartConfig,
    isLoading,
    error,
    clearError,
  };
}
