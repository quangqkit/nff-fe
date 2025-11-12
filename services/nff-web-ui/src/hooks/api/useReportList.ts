import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { baseApi } from '@/lib/api/base';
import { 
  ReportListFilters, 
  PaginatedReportResponse, 
  ReportListItem 
} from '@/types';

interface CreateReportRequest {
  title: string;
  reportTypeId: number;
  summary?: string;
  tags?: string[];
}

interface UpdateReportRequest {
  title?: string;
  summary?: string;
  tags?: string[];
  status?: string;
}

interface DuplicateResponse {
  id: number;
  title: string;
  message: string;
}

interface ExportResponse {
  success: boolean;
  downloadUrl?: string;
  message?: string;
}

interface ShareResponse {
  success: boolean;
  shareUrl?: string;
  message?: string;
}

interface PreviewResponse {
  htmlContent: string;
  metadata: {
    title: string;
    lastUpdated: Date;
    pageCount: number;
  };
}

export const useReports = (filters: ReportListFilters = {}) => {
  return useQuery<PaginatedReportResponse, Error>({
    queryKey: ['reports', filters],
    queryFn: () => baseApi.get('reports', { params: filters }),
  });
};

export const useReport = (id: number) => {
  return useQuery<ReportListItem, Error>({
    queryKey: ['reports', id],
    queryFn: () => baseApi.get(`reports/${id}`),
    enabled: !!id,
  });
};

export const useCreateReport = () => {
  const queryClient = useQueryClient();

  return useMutation<ReportListItem, Error, CreateReportRequest>({
    mutationFn: (data) => baseApi.post('reports', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
};

export const useUpdateReport = () => {
  const queryClient = useQueryClient();

  return useMutation<ReportListItem, Error, { id: number; data: UpdateReportRequest }>({
    mutationFn: ({ id, data }) => baseApi.put(`reports/${id}`, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reports', data.id] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
};

export const useDeleteReport = () => {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean }, Error, number>({
    mutationFn: (id) => baseApi.delete(`reports/${id}`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['reports', id] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
};

export const useArchiveReport = () => {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, Error, number>({
    mutationFn: (id) => baseApi.put(`reports/${id}/archive`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['reports', id] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
};

export const useDuplicateReport = () => {
  const queryClient = useQueryClient();

  return useMutation<DuplicateResponse, Error, number>({
    mutationFn: (id) => baseApi.post(`reports/${id}/duplicate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
};

export const useExportReport = () => {
  return useMutation<ExportResponse, Error, { id: number; exportType: string; config?: any }>({
    mutationFn: ({ id, exportType, config }) => 
      baseApi.post(`reports/${id}/export`, { exportType, config }),
  });
};

export const useShareReport = () => {
  return useMutation<ShareResponse, Error, { id: number; email: string; permission: string; message?: string }>({
    mutationFn: ({ id, email, permission, message }) => 
      baseApi.post(`reports/${id}/share`, { email, permission, message }),
  });
};

export const useGetReportExports = (id: number) => {
  return useQuery<any[], Error>({
    queryKey: ['reports', id, 'exports'],
    queryFn: () => baseApi.get(`reports/${id}/exports`),
    enabled: !!id,
  });
};

export const usePreviewReport = () => {
  return useMutation<PreviewResponse, Error, number>({
    mutationFn: (id) => baseApi.get(`reports/${id}/preview`),
  });
};
