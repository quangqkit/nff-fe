import { useMutation, useQuery } from '@tanstack/react-query';
import { baseApi } from '@/lib/api/base';
import {
  ExportRequest,
  ExportResponse,
  ExportStatusResponse,
  ExportInfo,
} from "@/types";

export const useExportPdf = () => {
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
  });
};

export const useExportHtml = () => {
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
  });
};

export const useExportStatus = (exportId: number) => {
  return useQuery<ExportStatusResponse, Error>({
    queryKey: ["exports", "status", exportId],
    queryFn: () => baseApi.get(`/exports/status/${exportId}`),
    enabled: !!exportId,
    refetchInterval: 2000,
  });
};

export const useExportAndGetHtml = () => {
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

      const viewUrl = `/exports/view/${exportResponse.data.id}`;
      const response = await fetch(viewUrl);

      if (!response.ok) {
        throw new Error("Failed to fetch HTML content");
      }

      return response.text();
    },
  });
};

export const useGetReportExports = (reportId: number) => {
  return useQuery<ExportInfo[], Error>({
    queryKey: ['exports', 'reports', reportId],
    queryFn: () => baseApi.get(`/reports/${reportId}/exports`),
    enabled: !!reportId,
  });
};
