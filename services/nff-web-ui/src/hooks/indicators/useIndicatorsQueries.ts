import { useApiQuery, useApiMutation } from '@/lib/query/hooks';
import { httpClient } from '@/lib/http';

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

interface IndicatorsResponse {
  data: MacroIndicator[];
  pagination: PaginationInfo;
}

const indicatorsService = {
  async getIndicators(
    categoryId: number,
    options: {
      dateRangeStart?: string;
      dateRangeEnd?: string;
      reportTypeId?: number;
      limit?: number;
      offset?: number;
    } = {}
  ) {
    const params = new URLSearchParams();
    const defaultStartDate = options.dateRangeStart || "2000-01-01";
    const defaultEndDate =
      options.dateRangeEnd || new Date().toISOString().split("T")[0];

    params.append("dateRangeStart", defaultStartDate);
    params.append("dateRangeEnd", defaultEndDate);

    if (options.reportTypeId) {
      params.append("reportTypeId", String(options.reportTypeId));
    }

    const limit = options.limit || 10;
    const offset = options.offset || 0;

    params.append("limit", String(limit));
    params.append("offset", String(offset));

    const url = `/reports/categories/${categoryId}/indicators?${params.toString()}`;
    return httpClient.get<IndicatorsResponse>(url);
  },

  async getCombinedIndicators(
    options: {
      dateRangeStart?: string;
      dateRangeEnd?: string;
    } = {}
  ) {
    const params = new URLSearchParams();
    const defaultStartDate = options.dateRangeStart || "2000-01-01";
    const defaultEndDate =
      options.dateRangeEnd || new Date().toISOString().split("T")[0];

    params.append("dateRangeStart", defaultStartDate);
    params.append("dateRangeEnd", defaultEndDate);

    const url = `/reports/categories/1/indicators?${params.toString()}`;
    return httpClient.get<MacroIndicator[]>(url);
  },
};

export function useIndicators(
  categoryId: number,
  options: {
    dateRangeStart?: string;
    dateRangeEnd?: string;
    reportTypeId?: number;
    limit?: number;
    offset?: number;
    enabled?: boolean;
  } = {}
) {
  const { enabled = true, ...fetchOptions } = options;

  return useApiQuery(
    ["indicators", categoryId, fetchOptions],
    () => indicatorsService.getIndicators(categoryId, fetchOptions),
    {
      enabled,
      staleTime: 5 * 60 * 1000,
      select: (response) => {
        const filteredData = response.data.data
          .filter((indicator: MacroIndicator) => {
            const hasData =
              indicator.data_points && indicator.data_points.length > 0;
            return hasData || indicator.isDefault;
          })
          .sort((a: MacroIndicator, b: MacroIndicator) => {
            if (a.isDefault && !b.isDefault) return -1;
            if (!a.isDefault && b.isDefault) return 1;
            return a.indicator_name.localeCompare(b.indicator_name);
          });

        return {
          ...response,
          data: {
            ...response.data,
            data: filteredData,
          },
        };
      },
    }
  );
}

export function useCombinedIndicators(
  options: {
    dateRangeStart?: string;
    dateRangeEnd?: string;
    enabled?: boolean;
  } = {}
) {
  const { enabled = true, ...fetchOptions } = options;

  return useApiQuery(
    ["indicators", "combined", fetchOptions],
    () => indicatorsService.getCombinedIndicators(fetchOptions),
    {
      enabled,
      staleTime: 5 * 60 * 1000,
      select: (response) => {
        const combinedIndicators: CombinedIndicator[] = response.data
          .filter(
            (indicator: MacroIndicator) =>
              indicator.data_points && indicator.data_points.length > 0
          )
          .map((indicator: MacroIndicator) => ({
            ...indicator,
            categoryName: "Macro" as const,
            categoryId: 1,
          }))
          .sort((a: CombinedIndicator, b: CombinedIndicator) => {
            if (a.isDefault && !b.isDefault) return -1;
            if (!a.isDefault && b.isDefault) return 1;
            return a.indicator_name.localeCompare(b.indicator_name);
          });

        return {
          ...response,
          data: combinedIndicators,
        };
      },
    }
  );
}

export function filterIndicatorsByDateRange(
  indicators: MacroIndicator[],
  startDate: string,
  endDate: string
): MacroIndicator[] {
  return indicators.map((indicator) => {
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
  });
}

export function filterIndicatorByDateRange(
  indicators: MacroIndicator[],
  indicatorId: string,
  startDate: string,
  endDate: string
): MacroIndicator[] {
  return indicators.map((indicator) => {
    if (indicator.indicator_id === indicatorId) {
      return filterIndicatorsByDateRange([indicator], startDate, endDate)[0];
    }
    return indicator;
  });
}
