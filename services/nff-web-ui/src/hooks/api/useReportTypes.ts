import { useQuery } from '@tanstack/react-query';
import { baseApi } from '@/lib/api/base';
import { ReportType } from '@/types';

export const useReportTypes = () => {
  return useQuery<ReportType[], Error>({
    queryKey: ['report-types'],
    queryFn: () => baseApi.get('/report-types'),
    staleTime: 5 * 60 * 1000,
  });
};

export const useReportType = (id: number) => {
  return useQuery<ReportType, Error>({
    queryKey: ['report-types', id],
    queryFn: () => baseApi.get(`/report-types/${id}`),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};
