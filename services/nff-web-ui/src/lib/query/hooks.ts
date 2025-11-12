import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { httpClient, ApiResponse } from '@/lib/http';
import { QUERY_KEYS } from './query-client';

export function useApiQuery<T>(
  queryKey: readonly unknown[],
  queryFn: () => Promise<ApiResponse<T>>,
  options?: Omit<UseQueryOptions<ApiResponse<T>, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey,
    queryFn,
    ...options,
  });
}

export function useApiMutation<TData = unknown, TVariables = unknown>(
  mutationFn: (variables: TVariables) => Promise<ApiResponse<TData>>,
  options?: UseMutationOptions<ApiResponse<TData>, Error, TVariables>
) {
  return useMutation({
    mutationFn,
    onSuccess: (data, variables, context) => {
      options?.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      options?.onError?.(error, variables, context);
    },
    onSettled: (data, error, variables, context) => {
      options?.onSettled?.(data, error, variables, context);
    },
  });
}

export function useInvalidateQueries() {
  const queryClient = useQueryClient();

  const invalidateQueries = (queryKey: readonly unknown[]) => {
    return queryClient.invalidateQueries({ queryKey });
  };

  const invalidateAllQueries = () => {
    return queryClient.invalidateQueries();
  };

  const removeQueries = (queryKey: readonly unknown[]) => {
    return queryClient.removeQueries({ queryKey });
  };

  return {
    invalidateQueries,
    invalidateAllQueries,
    removeQueries,
  };
}

export function useOptimisticUpdate<TData, TVariables>(
  queryKey: readonly unknown[],
  mutationFn: (variables: TVariables) => Promise<ApiResponse<TData>>,
  optimisticUpdateFn: (
    oldData: TData | undefined,
    variables: TVariables
  ) => TData,
  options?: UseMutationOptions<ApiResponse<TData>, Error, TVariables>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onMutate: async (
      variables: TVariables
    ): Promise<{ previousData: TData | undefined } | undefined> => {
      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData<TData>(queryKey);

      queryClient.setQueryData(
        queryKey,
        optimisticUpdateFn(previousData, variables)
      );

      return { previousData };
    },
    onError: (error, variables, context) => {
      const typedContext = context as
        | { previousData: TData | undefined }
        | undefined;
      if (typedContext?.previousData) {
        queryClient.setQueryData(queryKey, typedContext.previousData);
      }
      options?.onError?.(error, variables, context);
    },
    onSettled: (data, error, variables, context) => {
      queryClient.invalidateQueries({ queryKey });
      options?.onSettled?.(data, error, variables, context);
    },
    ...options,
  });
}
