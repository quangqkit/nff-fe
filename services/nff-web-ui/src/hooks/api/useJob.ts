"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { baseApi } from "@/lib/api/base";
import { QUERY_KEYS } from "@/lib/query/query-client";
import { toastService } from "@/services/toast/toast.service";
import {
  IndicatorLogStatus,
  IndicatorLogsResponse,
  UsePaginationProps,
  UsePaginationReturn,
  UseSelectionProps,
  UseSelectionReturn,
} from "@/types";
import { useState, useCallback, useEffect } from "react";

export interface UseJobsParams extends Record<string, unknown> {
  status?: IndicatorLogStatus;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export function useJobs(params: UseJobsParams = {}) {
  const queryClient = useQueryClient();

  const query = useQuery<IndicatorLogsResponse>({
    queryKey: QUERY_KEYS.JOBS.LIST(params),
    queryFn: () => baseApi.get("/jobs/indicator-logs", { params }),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const retryMultipleMutation = useMutation({
    mutationFn: (indicatorIds: number[]) =>
      baseApi.post("/jobs/indicator-logs/retry-multiple", { indicatorIds }),
    onSuccess: (_, indicatorIds) => {
      toastService.success(
        "Success",
        `Retry initiated for ${indicatorIds.length} indicators`
      );
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.JOBS.LIST(params),
      });
    },
    onError: (error) => {
      console.error("Retry failed:", error);
      toastService.error("Error", "Failed to retry selected indicators");
    },
  });

  const refresh = () => {
    query.refetch();
  };

  return {
    ...query,
    logs: query.data?.logs || [],
    totalPages: query.data?.totalPages || 1,
    total: query.data?.total || 0,
    loading: query.isLoading,
    error: query.error,
    retryMultiple: retryMultipleMutation.mutate,
    retrying: retryMultipleMutation.isPending,
    refresh,
  };
}

export function usePagination({
  initialPage = 1,
  pageSize = 10,
}: UsePaginationProps = {}): UsePaginationReturn {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSizeState, setPageSize] = useState(pageSize);

  const goToNextPage = useCallback(() => {
    setCurrentPage((prev) => prev + 1);
  }, []);

  const goToPreviousPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  }, []);

  const goToFirstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const goToLastPage = useCallback((totalPages: number) => {
    setCurrentPage(totalPages);
  }, []);

  const reset = useCallback(() => {
    setCurrentPage(initialPage);
  }, [initialPage]);

  return {
    currentPage,
    pageSize: pageSizeState,
    setCurrentPage,
    setPageSize,
    goToNextPage,
    goToPreviousPage,
    goToFirstPage,
    goToLastPage,
    reset,
  };
}

export function useSelection<T>({
  getKey,
  initialSelected = [],
}: UseSelectionProps<T>): UseSelectionReturn<T> {
  const [selectedItems, setSelectedItems] =
    useState<(string | number)[]>(initialSelected);

  const isSelected = useCallback(
    (item: T) => {
      const key = getKey(item);
      return selectedItems.includes(key);
    },
    [selectedItems, getKey]
  );

  const isAllSelected = useCallback(
    (items: T[]) => {
      if (items.length === 0) return false;
      return items.every((item) => isSelected(item));
    },
    [isSelected]
  );

  const isIndeterminate = useCallback(
    (items: T[]) => {
      const selectedCount = items.filter((item) => isSelected(item)).length;
      return selectedCount > 0 && selectedCount < items.length;
    },
    [isSelected]
  );

  const selectItem = useCallback(
    (item: T) => {
      const key = getKey(item);
      setSelectedItems((prev) => [...prev, key]);
    },
    [getKey]
  );

  const deselectItem = useCallback(
    (item: T) => {
      const key = getKey(item);
      setSelectedItems((prev) => prev.filter((id) => id !== key));
    },
    [getKey]
  );

  const toggleItem = useCallback(
    (item: T) => {
      if (isSelected(item)) {
        deselectItem(item);
      } else {
        selectItem(item);
      }
    },
    [isSelected, selectItem, deselectItem]
  );

  const selectAll = useCallback(
    (items: T[]) => {
      const keys = items.map((item) => getKey(item));
      setSelectedItems((prev) => [...new Set([...prev, ...keys])]);
    },
    [getKey]
  );

  const deselectAll = useCallback(() => {
    setSelectedItems([]);
  }, []);

  const toggleAll = useCallback(
    (items: T[]) => {
      if (isAllSelected(items)) {
        const keysToRemove = items.map((item) => getKey(item));
        setSelectedItems((prev) =>
          prev.filter((id) => !keysToRemove.includes(id))
        );
      } else {
        selectAll(items);
      }
    },
    [isAllSelected, getKey, selectAll]
  );

  const reset = useCallback(() => {
    setSelectedItems(initialSelected);
  }, [initialSelected]);

  return {
    selectedItems,
    isSelected,
    isAllSelected,
    isIndeterminate,
    selectItem,
    deselectItem,
    toggleItem,
    selectAll,
    deselectAll,
    toggleAll,
    setSelectedItems,
    reset,
    selectedCount: selectedItems.length,
  };
}
