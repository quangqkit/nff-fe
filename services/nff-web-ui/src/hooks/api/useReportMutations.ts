import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { baseApi } from '@/lib/api/base';
import { ReportType, Report } from '@/types';
import { 
  SectionData, 
  AddSectionRequest, 
  AddSectionResponse, 
  UpdateReportRequest,
  DeleteChartResponse,
  UpdateChartRequest,
  UpdateChartResponse
} from '@/types';

export const useReportTypes = () => {
  return useQuery<ReportType[], Error>({
    queryKey: ['report-types'],
    queryFn: () => baseApi.get('/report-types'),
    staleTime: 5 * 60 * 1000,
  });
};

export const useGenerateReport = () => {
  const queryClient = useQueryClient();

  return useMutation<Report, Error, number>({
    mutationFn: (reportTypeId) => 
      baseApi.post('/reports/generate', { reportTypeId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
};

export const useSection = (reportId: number, sectionId: number) => {
  return useQuery<SectionData | null, Error>({
    queryKey: ['sections', reportId, sectionId],
    queryFn: () => baseApi.get(`/reports/${reportId}/sections/${sectionId}`),
    enabled: !!reportId && !!sectionId,
  });
};

export const useAddSection = () => {
  const queryClient = useQueryClient();

  return useMutation<AddSectionResponse, Error, number>({
    mutationFn: (reportId) => 
      baseApi.post(`/blocks/sections/${reportId}`, {
        title: `Section ${Date.now()}`,
        orderIndex: 0,
      }),
    onSuccess: (_, reportId) => {
      queryClient.invalidateQueries({ queryKey: ['sections', reportId] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
};

export const useUpdateReport = () => {
  const queryClient = useQueryClient();

  return useMutation<Report, Error, { reportId: number; data: UpdateReportRequest }>({
    mutationFn: ({ reportId, data }) => 
      baseApi.put(`/reports/${reportId}`, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reports', data.id] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
};

export const useDeleteChart = () => {
  const queryClient = useQueryClient();

  return useMutation<DeleteChartResponse, Error, number>({
    mutationFn: (chartId) => 
      baseApi.delete(`/charts/${chartId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['charts'] });
      queryClient.invalidateQueries({ queryKey: ['sections'] });
    },
  });
};

export const useUpdateChart = () => {
  const queryClient = useQueryClient();

  return useMutation<UpdateChartResponse, Error, { chartId: number; data: UpdateChartRequest }>({
    mutationFn: ({ chartId, data }) => 
      baseApi.put(`/charts/${chartId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['charts'] });
      queryClient.invalidateQueries({ queryKey: ['sections'] });
    },
  });
};

export const useDeleteReport = () => {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean }, Error, number>({
    mutationFn: (reportId) => 
      baseApi.delete(`/reports/${reportId}`),
    onSuccess: (_, reportId) => {
      queryClient.invalidateQueries({ queryKey: ['reports', reportId] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
};

export const useReportById = (reportId: number) => {
  return useQuery<Report, Error>({
    queryKey: ['reports', reportId],
    queryFn: () => baseApi.get(`/reports/${reportId}`),
    enabled: !!reportId,
  });
};

export const useReportWithBlocks = (reportId: number) => {
  return useQuery<Report, Error>({
    queryKey: ['reports', reportId, 'with-blocks'],
    queryFn: () => baseApi.get(`/reports/${reportId}/with-blocks`),
    enabled: !!reportId,
  });
};

export const useReportPreviewData = (reportId: number) => {
  return useQuery<any, Error>({
    queryKey: ['reports', reportId, 'preview'],
    queryFn: () => baseApi.get(`/reports/${reportId}/preview`),
    enabled: !!reportId,
  });
};
