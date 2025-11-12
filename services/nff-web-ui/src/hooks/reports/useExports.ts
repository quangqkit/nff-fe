import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { baseApi } from "@/lib/api/base";
import { queryKeys } from "@/lib/query/keys";
import { API_CONFIG } from "@/constants/api";
import type {
  ExportRequest,
  ExportResponse,
  ExportStatusResponse,
} from "@/types";

export function useExportStatus(exportId: number, enabled = true) {
  return useQuery<ExportStatusResponse, Error>({
    queryKey: queryKeys.exports.status(exportId),
    queryFn: () => baseApi.get(`/exports/status/${exportId}`),
    enabled: enabled && !!exportId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data || query.state.error) return false;
      const status = data.data?.status;
      const isPolling = status === "pending" || status === "processing";
      const hasPolledTooLong =
        Date.now() - (query.state.dataUpdatedAt || 0) > 5 * 60 * 1000;

      return isPolling && !hasPolledTooLong ? 2000 : false;
    },
    refetchIntervalInBackground: false,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

export function useExportPdf() {
  const queryClient = useQueryClient();

  return useMutation<
    ExportResponse,
    Error,
    { reportId: number; config?: ExportRequest["config"] }
  >({
    mutationFn: ({ reportId, config }) =>
      baseApi.post(
        `/exports/reports/${reportId}/pdf`,
        {
          config: {
            includeCharts: true,
            includeImages: true,
            ...config,
          },
        },
        {
          timeout: 240000,
        }
      ),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.exports.all });
      if (data.data?.id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.exports.status(data.data.id),
        });
      }
    },
  });
}

export function useExportHtml() {
  const queryClient = useQueryClient();

  return useMutation<
    ExportResponse,
    Error,
    { reportId: number; config?: ExportRequest["config"] }
  >({
    mutationFn: ({ reportId, config }) =>
      baseApi.post(
        `/exports/reports/${reportId}/html`,
        {
          config: {
            includeCharts: true,
            includeImages: true,
            ...config,
          },
        },
        {
          timeout: 120000,
        }
      ),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.exports.all });
      if (data.data?.id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.exports.status(data.data.id),
        });
      }
    },
  });
}

export function useExportAndGetHtml() {
  return useMutation<
    string,
    Error,
    { reportId: number; config?: ExportRequest["config"] }
  >({
    mutationFn: async ({ reportId, config }) => {
      const exportResponse = (await baseApi.post(
        `/exports/reports/${reportId}/html`,
        {
          config: {
            includeCharts: true,
            includeImages: true,
            ...config,
          },
        },
        {
          timeout: 120000,
        }
      )) as ExportResponse;

      if (!exportResponse.success || !exportResponse.data) {
        throw new Error(exportResponse.message || "Export failed");
      }

      const exportId = exportResponse.data.id;
      const maxRetries = 30;
      const retryDelay = 2000;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const statusResponse = (await baseApi.get(
            `/exports/status/${exportId}`
          )) as ExportStatusResponse;

          if (statusResponse.data?.status === "completed") {
            const viewUrl = `/exports/view/${exportId}`;
            const response = await baseApi.get(viewUrl, {
              timeout: 60000,
            });

            if (typeof response === "string") {
              return response;
            } else if (response && typeof (response as any).data === "string") {
              return (response as any).data;
            } else {
              throw new Error(
                "Invalid response format from HTML view endpoint"
              );
            }
          } else if (statusResponse.data?.status === "failed") {
            throw new Error(statusResponse.data?.error || "Export failed");
          }

          if (attempt < maxRetries - 1) {
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
          }
        } catch (error) {
          if (attempt === maxRetries - 1) {
            throw error;
          }
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
      }

      throw new Error(
        "Export timeout - export did not complete within expected time"
      );
    },
    retry: false,
  });
}

export function getDownloadUrl(exportId: number): string {
  return `${API_CONFIG.BASE_URL}/exports/download/${exportId}`;
}

export function getViewUrl(exportId: number): string {
  return `${API_CONFIG.BASE_URL}/exports/view/${exportId}`;
}
