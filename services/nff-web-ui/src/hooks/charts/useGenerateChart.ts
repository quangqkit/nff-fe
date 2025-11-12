import { useState, useCallback } from "react";
import { baseApi } from "@/lib/api/base";

interface GenerateChartRequest {
  reportId: number;
  sectionId: number;
  categoryId: number;
  title?: string;
  selectedIndicators: Array<{
    id: number;
    chartType: string;
    dateRange: {
      preset: string;
      customStart?: string;
      customEnd?: string;
    };
  }>;
  chartConfig: {
    position: string;
    config: string;
  };
  name?: string;
  chartTitle?: string;
  orderIndex?: number;
  columns?: number;
}

interface ChartConfig {
  type: string;
  title?: string;
  xAxis?: {
    title?: string;
    type?: string;
  };
  yAxis?: {
    title?: string;
    type?: string;
  };
  series?: Array<{
    name: string;
    data: number[];
    type?: string;
  }>;
  options?: Record<string, unknown>;
}

interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }>;
  [key: string]: unknown;
}

interface GenerateChartResponse {
  id: number;
  title: string | null;
  chartConfig: ChartConfig;
  chartData: ChartData;
  chartImagePath: string | null;
  orderIndex: number;
  generatedAt: Date;
  status: "generated" | "failed";
  preview?: {
    chartData: ChartData;
    chartConfig: ChartConfig;
    metadata: {
      totalDataPoints: number;
      dateRange: {
        start: Date;
        end: Date;
      };
      dataSources: string[];
      lastUpdated: Date;
      dataQuality: "high" | "medium" | "low";
    };
  };
}

interface UseGenerateChartReturn {
  generateChart: (
    request: GenerateChartRequest
  ) => Promise<GenerateChartResponse | null>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useGenerateChart(): UseGenerateChartReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateChart = useCallback(
    async (
      request: GenerateChartRequest
    ): Promise<GenerateChartResponse | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const sanitizedRequest = {
          sectionId: request.sectionId,
          name: request.name || `Chart ${Date.now()}`,
          chartTitle: request.chartTitle || request.title || "New Chart",
          categoryId: request.categoryId,
          selectedIndicators: request.selectedIndicators,
          chartConfig: {
            position: request.chartConfig.position,
            config: request.chartConfig.config,
          },
          orderIndex: request.orderIndex || 0,
          columns: request.columns || 0,
        };

        const startTime = Date.now();
        const response = await baseApi.post<GenerateChartResponse>(
          "/charts/blocks",
          sanitizedRequest
        );

        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, 1000 - elapsedTime);

        if (remainingTime > 0) {
          await new Promise((resolve) => setTimeout(resolve, remainingTime));
        }

        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to generate chart";
        setError(errorMessage);
        console.error("Error generating chart:", err);
        return null;
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
    generateChart,
    isLoading,
    error,
    clearError,
  };
}
