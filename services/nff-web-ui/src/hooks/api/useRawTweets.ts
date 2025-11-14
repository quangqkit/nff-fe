"use client";

import { baseApi } from "@/lib/api/base";
import { RawTweetsFilters, RawTweetsResponse } from "@/types/tweets";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

// Query Keys
export const rawTweetsKeys = {
  all: ["raw-tweets"] as const,
  lists: () => [...rawTweetsKeys.all, "list"] as const,
  list: (filters?: RawTweetsFilters, pageNumber?: number, pageSize?: number) =>
    [...rawTweetsKeys.lists(), filters ?? null, pageNumber, pageSize] as const,
};

const buildQueryParams = (
  filters: RawTweetsFilters | undefined,
  pageNumber: number,
  pageSize: number
) => {
  const params: Record<string, string | number> = {
    pageNumber,
    pageSize,
  };

  if (filters?.name) {
    params.search = filters.name;
  }

  if (filters?.ticker) {
    params.symbol = filters.ticker;
  }

  if (filters?.schedule) {
    params.scheduleId = filters.schedule;
  }

  if (filters?.dateRange?.from) {
    params.from = filters.dateRange.from.toISOString();
  }

  if (filters?.dateRange?.to) {
    params.to = filters.dateRange.to.toISOString();
  }

  if (filters?.categories && filters.categories.length > 0) {
    params.category = filters.categories.join(",");
  }

  return params;
};

interface UseRawTweetsParams {
  filters?: RawTweetsFilters;
  pageNumber?: number;
  pageSize?: number;
  enabled?: boolean;
}

// Hook to fetch raw tweets from API with pagination
export const useRawTweets = ({
  filters,
  pageNumber = 1,
  pageSize = 10,
  enabled = true,
}: UseRawTweetsParams = {}) => {
  return useQuery<RawTweetsResponse, Error>({
    queryKey: rawTweetsKeys.list(filters, pageNumber, pageSize),
    queryFn: () =>
      baseApi.get<RawTweetsResponse>("/lobstr/raw-data", {
        params: buildQueryParams(filters, pageNumber, pageSize),
      }),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });
};
