import { useState, useCallback } from "react";
import {
  useIndicators as useIndicatorsQuery,
  useCombinedIndicators,
} from "@/hooks/indicators/useIndicatorsQueries";
import { baseApi } from "@/lib/api/base";

export interface Indicator {
  id: number;
  name: string;
  symbol: string;
  dataSource: string;
  defaultChartType: string;
  defaultDateRangeStart: string;
  defaultDateRangeEnd: string;
  description: string;
  category: {
    id: number;
    name: string;
  };
  values?: Array<{
    indicator_id: string;
    indicator_name: string;
    values: number[];
  }>;
  indicator_id?: string;
  groupName?: string;
  indicators?: Indicator[];
}

export interface MacroIndicator {
  id: number;
  indicator_id: string;
  series_ids?: string;
  indicator_name: string;
  source: string;
  subcategory?: string;
  priority?: string;
  release_frequency?: string;
  units?: string;
  latest_date: string;
  latest_value: number;
  isDefault?: boolean;
  defaultChartType?: string;
  data_points: Array<{
    date: string;
    value: number;
    normalized_value?: number;
    z_score?: number;
  }>;
  subcategoryData: {
    name: string;
    id: number;
    indicators: string[];
    values: number[];
  };
}

export interface SubcategoryData {
  name: string;
  id: number;
  indicators: string[];
  values: number[];
  groupName?: string;
}

export interface CombinedIndicator extends MacroIndicator {
  categoryName: string;
  categoryId: number;
}

interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

interface UseIndicatorsReturn {
  indicators: SubcategoryData[] | MacroIndicator[] | CombinedIndicator[];
  isLoading: boolean;
  error: string | null;
  pagination: PaginationInfo | null;
  fetchIndicators: (
    categoryId: number,
    dateRangeOptions?: {
      dateRangeStart?: string;
      dateRangeEnd?: string;
      reportTypeId?: number;
      limit?: number;
      offset?: number;
    }
  ) => Promise<void>;
  fetchMoreIndicators: () => Promise<void>;
  fetchCombinedIndicators: (dateRangeOptions?: {
    dateRangeStart?: string;
    dateRangeEnd?: string;
  }) => Promise<void>;
  filterIndicatorsByDateRange: (startDate: string, endDate: string) => void;
  filterIndicatorByDateRange: (
    indicatorId: string,
    startDate: string,
    endDate: string
  ) => void;
  clearError: () => void;
}

export function useIndicators(): UseIndicatorsReturn {
  const [indicators, setIndicators] = useState<
    SubcategoryData[] | MacroIndicator[] | CombinedIndicator[]
  >([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [lastFetchParams, setLastFetchParams] = useState<{
    categoryId: number;
    dateRangeOptions?: {
      dateRangeStart?: string;
      dateRangeEnd?: string;
      reportTypeId?: number;
      limit?: number;
      offset?: number;
    };
  } | null>(null);

  const indicatorsQuery = useIndicatorsQuery(lastFetchParams?.categoryId || 1, {
    ...lastFetchParams?.dateRangeOptions,
    enabled: !!lastFetchParams?.categoryId,
  });

  const combinedIndicatorsQuery = useCombinedIndicators({
    enabled: false, 
  });

  const isLoading =
    indicatorsQuery.isLoading || combinedIndicatorsQuery.isLoading;
  const error =
    indicatorsQuery.error?.message ||
    combinedIndicatorsQuery.error?.message ||
    null;

  const filterDataPointsByDateRange = (
    indicator: MacroIndicator,
    startDate?: string,
    endDate?: string
  ): MacroIndicator => {
    if (!startDate || !endDate) {
      return indicator;
    }

    const filteredDataPoints = indicator.data_points.filter((point) => {
      const pointDate = new Date(point.date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return pointDate >= start && pointDate <= end;
    });

    return {
      ...indicator,
      data_points: filteredDataPoints,
      subcategoryData: {
        ...indicator.subcategoryData,
        values: filteredDataPoints.map((point) => point.value),
      },
    };
  };

  const filterSingleIndicatorByDateRange = (
    indicators: MacroIndicator[],
    indicatorId: string,
    startDate: string,
    endDate: string
  ): MacroIndicator[] => {
    return indicators.map((indicator) => {
      if (indicator.indicator_id === indicatorId) {
        return filterDataPointsByDateRange(indicator, startDate, endDate);
      }
      return indicator;
    });
  };

  const fetchIndicators = useCallback(
    async (
      categoryId: number,
      dateRangeOptions?: {
        dateRangeStart?: string;
        dateRangeEnd?: string;
        reportTypeId?: number;
        limit?: number;
        offset?: number;
      }
    ) => {
      try {
        const params = new URLSearchParams();
        const defaultStartDate =
          dateRangeOptions?.dateRangeStart || "2000-01-01";
        const defaultEndDate =
          dateRangeOptions?.dateRangeEnd ||
          new Date().toISOString().split("T")[0];

        params.append("dateRangeStart", defaultStartDate);
        params.append("dateRangeEnd", defaultEndDate);

        if (dateRangeOptions?.reportTypeId) {
          params.append("reportTypeId", String(dateRangeOptions.reportTypeId));
        }

        const limit = dateRangeOptions?.limit || 10;
        const offset = dateRangeOptions?.offset || 0;

        params.append("limit", String(limit));
        params.append("offset", String(offset));

        const url = `/reports/categories/${categoryId}/indicators?${params.toString()}`;

        const response = await baseApi.get<{
          data: MacroIndicator[];
          pagination: PaginationInfo;
        }>(url);

        if (response) {
          setLastFetchParams({ categoryId, dateRangeOptions });
          setPagination(response.pagination);

          const data = response.data || (response as any);

          if (categoryId === 1 && Array.isArray(data)) {
            const filteredData = data
              .map((indicator) =>
                filterDataPointsByDateRange(
                  indicator,
                  defaultStartDate,
                  defaultEndDate
                )
              )
              .filter((indicator) => {
                const hasData =
                  indicator.data_points && indicator.data_points.length > 0;
                return hasData || indicator.isDefault;
              })
              .sort((a, b) => {
                if (a.isDefault && !b.isDefault) return -1;
                if (!a.isDefault && b.isDefault) return 1;
                return a.indicator_name.localeCompare(b.indicator_name);
              });

            if (offset > 0) {
              setIndicators(
                (prev) =>
                  [
                    ...(prev as MacroIndicator[]),
                    ...(filteredData as MacroIndicator[]),
                  ] as MacroIndicator[]
              );
            } else {
              setIndicators(filteredData as MacroIndicator[]);
            }
          } else {
            if (offset > 0) {
              setIndicators(
                (prev) =>
                  [
                    ...(prev as SubcategoryData[]),
                    ...(data as unknown as SubcategoryData[]),
                  ] as SubcategoryData[]
              );
            } else {
              setIndicators(data as unknown as SubcategoryData[]);
            }
          }
        }
      } catch (err) {
        console.error("Error fetching indicators:", err);
        if (dateRangeOptions?.offset === 0 || !dateRangeOptions?.offset) {
          setIndicators([]);
        }
      }
    },
    []
  );

  const fetchMoreIndicators = useCallback(async () => {
    if (!lastFetchParams || !pagination?.hasMore || isLoading) {
      return;
    }

    const { categoryId, dateRangeOptions } = lastFetchParams;
    const nextOffset = (pagination.offset || 0) + (pagination.limit || 10);

    await fetchIndicators(categoryId, {
      ...dateRangeOptions,
      offset: nextOffset,
    });
  }, [lastFetchParams, pagination, isLoading, fetchIndicators]);

  const filterIndicatorsByDateRange = useCallback(
    (startDate: string, endDate: string) => {
      setIndicators((prevIndicators) => {
        if (Array.isArray(prevIndicators) && prevIndicators.length > 0) {
          if ("indicator_id" in prevIndicators[0]) {
            return prevIndicators.map((indicator) =>
              filterDataPointsByDateRange(
                indicator as MacroIndicator,
                startDate,
                endDate
              )
            );
          }
        }
        return prevIndicators;
      });
    },
    []
  );

  const filterIndicatorByDateRange = useCallback(
    (indicatorId: string, startDate: string, endDate: string) => {
      setIndicators((prevIndicators) => {
        if (Array.isArray(prevIndicators) && prevIndicators.length > 0) {
          if ("indicator_id" in prevIndicators[0]) {
            return filterSingleIndicatorByDateRange(
              prevIndicators as MacroIndicator[],
              indicatorId,
              startDate,
              endDate
            );
          }
        }
        return prevIndicators;
      });
    },
    []
  );

  const fetchCombinedIndicators = useCallback(
    async (dateRangeOptions?: {
      dateRangeStart?: string;
      dateRangeEnd?: string;
    }) => {
      try {
        const params = new URLSearchParams();

        const defaultStartDate =
          dateRangeOptions?.dateRangeStart || "2000-01-01";
        const defaultEndDate =
          dateRangeOptions?.dateRangeEnd ||
          new Date().toISOString().split("T")[0];

        params.append("dateRangeStart", defaultStartDate);
        params.append("dateRangeEnd", defaultEndDate);

        const macroUrl = `/reports/categories/1/indicators?${params.toString()}`;
        const macroData = await baseApi.get<MacroIndicator[]>(macroUrl);

        const combinedIndicators: CombinedIndicator[] = [];

        if (macroData && Array.isArray(macroData)) {
          const macroIndicators = macroData
            .map((indicator) => {
              const filtered = filterDataPointsByDateRange(
                indicator,
                defaultStartDate,
                defaultEndDate
              );
              return {
                ...filtered,
                categoryName: "Macro" as const,
                categoryId: 1,
              } as CombinedIndicator;
            })
            .filter(
              (indicator) =>
                indicator.data_points && indicator.data_points.length > 0
            );
          combinedIndicators.push(...macroIndicators);
        }

        combinedIndicators.sort((a, b) => {
          if (a.isDefault && !b.isDefault) return -1;
          if (!a.isDefault && b.isDefault) return 1;

          const categoryCompare = a.categoryName.localeCompare(b.categoryName);
          if (categoryCompare !== 0) return categoryCompare;

          return a.indicator_name.localeCompare(b.indicator_name);
        });

        setIndicators(combinedIndicators);
      } catch (err) {
        console.error("Error fetching combined indicators:", err);
        setIndicators([]);
      }
    },
    []
  );

  const clearError = useCallback(() => {
    if (lastFetchParams) {
      fetchIndicators(
        lastFetchParams.categoryId,
        lastFetchParams.dateRangeOptions
      );
    }
  }, [lastFetchParams, fetchIndicators]);

  return {
    indicators,
    isLoading,
    error,
    pagination,
    fetchIndicators,
    fetchMoreIndicators,
    fetchCombinedIndicators,
    filterIndicatorsByDateRange,
    filterIndicatorByDateRange,
    clearError,
  };
}
