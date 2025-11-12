import { useQuery, useMutation } from '@tanstack/react-query';
import { baseApi } from '@/lib/api/base';
import { IndicatorLog, IndicatorLogsResponse, IndicatorLogStatus } from '@/types';

export const useIndicatorLogs = (params?: {
  status?: IndicatorLogStatus;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) => {
  return useQuery<IndicatorLogsResponse, Error>({
    queryKey: ['indicator-logs', params],
    queryFn: () => baseApi.get('/jobs/indicator-logs', { params }),
  });
};

export const useRetryMultipleIndicators = () => {
  return useMutation<any, Error, number[]>({
    mutationFn: (indicatorIds) => 
      baseApi.post('/jobs/indicator-logs/retry-multiple', { indicatorIds }),
  });
};
