"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { baseApi } from "@/lib/api/base";
import { QUERY_KEYS } from "@/lib/query/query-client";
import { useToast } from "@/hooks/core";
import type { Report, ReportType } from "@/types";
import type {
  SectionData,
  AddSectionResponse,
  UpdateReportRequest,
  DeleteChartResponse,
  UpdateChartRequest,
  UpdateChartResponse,
} from "@/types";

export const api = {
  getReportTypes: (): Promise<ReportType[]> =>
    baseApi.get<ReportType[]>("/report-types"),

  generateReport: async (reportTypeId: number): Promise<Report> => {
    try {
      const result = await baseApi.post<Report>("/reports/generate", {
        reportTypeId,
      });
      return result;
    } catch (error) {
      console.error("API: generateReport error:", error);
      throw error;
    }
  },

  getReportById: (reportId: number): Promise<Report> =>
    baseApi.get<Report>(`/reports/${reportId}`),

  getReportWithBlocks: (reportId: number): Promise<Report> =>
    baseApi.get<Report>(`/reports/${reportId}/with-blocks`),

  getReportPreviewData: (reportId: number): Promise<any> =>
    baseApi.get<any>(`/reports/${reportId}/preview`),

  getSection: (
    reportId: number,
    sectionId: number
  ): Promise<SectionData | null> =>
    baseApi
      .get<SectionData>(`/reports/${reportId}/sections/${sectionId}`)
      .catch(() => null),

  addSection: (reportId: number): Promise<AddSectionResponse> =>
    baseApi.post<AddSectionResponse>(`/blocks/sections/${reportId}`, {
      title: `Section ${Date.now()}`,
      orderIndex: 0,
    }),

  updateReport: (
    reportId: number,
    updateData: UpdateReportRequest
  ): Promise<Report> => baseApi.put<Report>(`/reports/${reportId}`, updateData),

  deleteReport: (reportId: number): Promise<{ success: boolean }> =>
    baseApi.delete<{ success: boolean }>(`/reports/${reportId}`),

  deleteChart: (chartId: number): Promise<DeleteChartResponse> =>
    baseApi.delete<DeleteChartResponse>(`/charts/${chartId}`),

  updateChart: (
    chartId: number,
    updateData: UpdateChartRequest
  ): Promise<UpdateChartResponse> =>
    baseApi.put<UpdateChartResponse>(`/charts/${chartId}`, updateData),

  getReports: (filters?: any): Promise<any> =>
    baseApi.get<any>("/reports", { params: filters }),
};

export function useReportTypes() {
  return useQuery<ReportType[], Error>({
    queryKey: QUERY_KEYS.REPORTS.TYPES(),
    queryFn: api.getReportTypes,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
}

export function useReports(filters?: any) {
  return useQuery<any, Error>({
    queryKey: QUERY_KEYS.REPORTS.ALL,
    queryFn: () => api.getReports(filters),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useGenerateReport() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation<Report, Error, number>({
    mutationFn: api.generateReport,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.REPORTS.ALL });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.REPORTS.TYPES });
      showToast({
        type: "success",
        title: "Report Generated Successfully!",
        description: "Your report has been created and is ready for editing.",
        duration: 5000,
      });
    },
    onError: (error) => {
      console.error("Failed to generate report:", error);
      showToast({
        type: "error",
        title: "Failed to Generate Report",
        description:
          error.message || "An error occurred while generating the report",
        duration: 5000,
      });
    },
  });
}

export function useReport(reportId: number, enabled = true) {
  return useQuery<Report, Error>({
    queryKey: QUERY_KEYS.REPORTS.DETAIL(reportId.toString()),
    queryFn: () => api.getReportById(reportId),
    enabled: enabled && !!reportId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useReportWithBlocks(reportId: number, enabled = true) {
  return useQuery<Report, Error>({
    queryKey: QUERY_KEYS.REPORTS.WITH_BLOCKS(reportId.toString()),
    queryFn: () => api.getReportWithBlocks(reportId),
    enabled: enabled && !!reportId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useReportPreview(reportId: number, enabled = true) {
  return useQuery<any, Error>({
    queryKey: QUERY_KEYS.REPORTS.PREVIEW(reportId.toString()),
    queryFn: () => api.getReportPreviewData(reportId),
    enabled: enabled && !!reportId,
    staleTime: 1 * 60 * 1000,
    gcTime: 3 * 60 * 1000,
  });
}

export function useSection(
  reportId: number,
  sectionId: number,
  enabled = true
) {
  return useQuery<SectionData | null, Error>({
    queryKey: QUERY_KEYS.SECTIONS.DETAIL(
      reportId.toString(),
      sectionId.toString()
    ),
    queryFn: () => api.getSection(reportId, sectionId),
    enabled: enabled && !!reportId && !!sectionId,
    staleTime: 1 * 60 * 1000,
    gcTime: 3 * 60 * 1000,
    select: (data) => data || null,
  });
}

export function useAddSection() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation<AddSectionResponse, Error, number>({
    mutationFn: api.addSection,
    onSuccess: (data, reportId) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.REPORTS.ALL });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.REPORTS.WITH_BLOCKS(reportId.toString()),
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SECTIONS.ALL });
      showToast({
        type: "success",
        title: "Section Added",
        description: "New section has been added successfully.",
        duration: 3000,
      });
    },
    onError: (error) => {
      console.error("Failed to add section:", error);
      showToast({
        type: "error",
        title: "Failed to Add Section",
        description:
          error.message || "An error occurred while adding the section",
        duration: 3000,
      });
    },
  });
}

export function useUpdateReport() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation<
    Report,
    Error,
    { reportId: number; updateData: UpdateReportRequest }
  >({
    mutationFn: ({ reportId, updateData }) =>
      api.updateReport(reportId, updateData),
    onSuccess: (data, { reportId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.REPORTS.ALL });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.REPORTS.DETAIL(reportId.toString()),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.REPORTS.WITH_BLOCKS(reportId.toString()),
      });
      showToast({
        type: "success",
        title: "Report Updated",
        description: "Report has been updated successfully.",
        duration: 3000,
      });
    },
    onError: (error) => {
      console.error("Failed to update report:", error);
      showToast({
        type: "error",
        title: "Failed to Update Report",
        description:
          error.message || "An error occurred while updating the report",
        duration: 3000,
      });
    },
  });
}

export function useDeleteReport() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation<{ success: boolean }, Error, number>({
    mutationFn: api.deleteReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.REPORTS.ALL });
      showToast({
        type: "success",
        title: "Report Deleted",
        description: "Report has been deleted successfully.",
        duration: 3000,
      });
    },
    onError: (error) => {
      console.error("Failed to delete report:", error);
      showToast({
        type: "error",
        title: "Failed to Delete Report",
        description:
          error.message || "An error occurred while deleting the report",
        duration: 3000,
      });
    },
  });
}

export function useDeleteChart() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation<DeleteChartResponse, Error, number>({
    mutationFn: api.deleteChart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.REPORTS.ALL });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CHARTS.ALL });
      showToast({
        type: "success",
        title: "Chart Deleted",
        description: "Chart has been deleted successfully.",
        duration: 3000,
      });
    },
    onError: (error) => {
      console.error("Failed to delete chart:", error);
      showToast({
        type: "error",
        title: "Failed to Delete Chart",
        description:
          error.message || "An error occurred while deleting the chart",
        duration: 3000,
      });
    },
  });
}

export function useUpdateChart() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation<
    UpdateChartResponse,
    Error,
    { chartId: number; updateData: UpdateChartRequest }
  >({
    mutationFn: ({ chartId, updateData }) =>
      api.updateChart(chartId, updateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.REPORTS.ALL });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CHARTS.ALL });
      showToast({
        type: "success",
        title: "Chart Updated",
        description: "Chart has been updated successfully.",
        duration: 3000,
      });
    },
    onError: (error) => {
      console.error("Failed to update chart:", error);
      showToast({
        type: "error",
        title: "Failed to Update Chart",
        description:
          error.message || "An error occurred while updating the chart",
        duration: 3000,
      });
    },
  });
}
