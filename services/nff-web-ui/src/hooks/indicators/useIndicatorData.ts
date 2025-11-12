import { useState, useCallback } from "react";
import { baseApi } from "@/lib/api/base";

interface IndicatorValueItem {
  values: number[];
  [key: string]: unknown;
}

interface Indicator {
  id: number;
  symbol?: string;
  values: IndicatorValueItem[];
  [key: string]: unknown;
}

interface UseIndicatorDataReturn {
  indicatorData: Record<string, unknown> | null;
  isLoading: boolean;
  error: string | null;
  fetchIndicatorData: (
    indicatorIds: number[],
    categoryId?: number
  ) => Promise<void>;
  clearError: () => void;
}

export function useIndicatorData(): UseIndicatorDataReturn {
  const [indicatorData, setIndicatorData] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIndicatorData = useCallback(
    async (indicatorIds: number[], categoryId?: number) => {
      if (indicatorIds.length === 0) {
        setIndicatorData(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        if (categoryId) {
          try {
            const categoryData = await baseApi.get(
              `/reports/categories/${categoryId}/indicators`
            );

            const filteredData: Record<string, unknown> = {};

            if (Array.isArray(categoryData)) {
              categoryData.forEach((indicator: Indicator) => {
                if (indicator.id && indicatorIds.includes(indicator.id)) {
                  if (indicator.values && Array.isArray(indicator.values)) {
                    const key = indicator.symbol || `indicator_${indicator.id}`;

                    const allData: Array<{ date: string; value: number }> = [];

                    indicator.values.forEach(
                      (valueItem: IndicatorValueItem) => {
                        if (
                          valueItem.values &&
                          Array.isArray(valueItem.values)
                        ) {
                          valueItem.values.forEach(
                            (val: number, dataIndex: number) => {
                              const startDate = new Date("2020-01-01");
                              const currentDate = new Date(
                                startDate.getTime() +
                                  dataIndex * 30 * 24 * 60 * 60 * 1000
                              );
                              allData.push({
                                date: currentDate.toISOString().split("T")[0],
                                value: val,
                              });
                            }
                          );
                        }
                      }
                    );

                    filteredData[key] = {
                      indicator_id: indicator.symbol || key,
                      indicator_name: indicator.name || key,
                      subcategory: indicator.name || "Unknown",
                      data: allData,
                    };
                  }
                }
              });
            }

            if (Object.keys(filteredData).length > 0) {
              setIndicatorData(filteredData);
              return;
            }
          } catch (categoryError) {
          }
        }

        setIndicatorData({});
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch indicator data";
        setError(errorMessage);
        console.error("Error fetching indicator data:", err);
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
    indicatorData,
    isLoading,
    error,
    fetchIndicatorData,
    clearError,
  };
}
