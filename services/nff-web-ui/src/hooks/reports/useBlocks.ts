import { useMutation, useQueryClient } from '@tanstack/react-query';
import { baseApi } from '@/lib/api/base';
import { queryKeys } from '@/lib/query/keys';
import type { CreateBlockDto, BlockResponse, DuplicateBlockDto } from '@/lib/api/block';

export function useCreateBlock() {
  const queryClient = useQueryClient();

  return useMutation<BlockResponse, Error, { sectionId: number; data: CreateBlockDto }>({
    mutationFn: ({ sectionId, data }) => baseApi.post(`blocks/sections/${sectionId}/blocks`, data),
    onSuccess: (_, { sectionId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.blocks.bySection(sectionId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.sections.all });
    },
  });
}

export function useUpdateBlock() {
  const queryClient = useQueryClient();

  return useMutation<BlockResponse, Error, { blockId: number; data: Partial<CreateBlockDto> }>({
    mutationFn: ({ blockId, data }) => baseApi.put(`blocks/${blockId}`, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.blocks.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.blocks.bySection(data.sectionId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.sections.all });
    },
  });
}

export function useDeleteBlock() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number>({
    mutationFn: (blockId) => baseApi.delete(`blocks/${blockId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.blocks.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.sections.all });
    },
  });
}

export function useDuplicateBlock() {
  const queryClient = useQueryClient();

  return useMutation<BlockResponse, Error, { blockId: number; data: DuplicateBlockDto }>({
    mutationFn: ({ blockId, data }) => baseApi.post(`blocks/${blockId}/duplicate`, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.blocks.bySection(data.sectionId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.sections.all });
    },
  });
}

export function useToggleBlock() {
  const queryClient = useQueryClient();

  return useMutation<BlockResponse, Error, number>({
    mutationFn: (blockId) => baseApi.patch(`/blocks/${blockId}/toggle`),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.blocks.detail(data.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.blocks.bySection(data.sectionId),
      });
    },
  });
}

