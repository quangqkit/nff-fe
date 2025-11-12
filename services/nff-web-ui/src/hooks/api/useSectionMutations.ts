import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { baseApi } from '@/lib/api/base';
import { AddSectionResponse, AddSectionRequest } from "@/types";

export const useSection = (sectionId: number) => {
  return useQuery<AddSectionResponse, Error>({
    queryKey: ["sections", sectionId],
    queryFn: () => baseApi.get(`blocks/sections/${sectionId}`),
    enabled: !!sectionId,
  });
};

export const useToggleSection = () => {
  const queryClient = useQueryClient();

  return useMutation<AddSectionResponse, Error, number>({
    mutationFn: (sectionId) =>
      baseApi.patch(`/blocks/sections/${sectionId}/toggle`),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["sections", data.id] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
};

export const useUpdateSection = () => {
  const queryClient = useQueryClient();

  return useMutation<
    AddSectionResponse,
    Error,
    { sectionId: number; data: AddSectionRequest }
  >({
    mutationFn: ({ sectionId, data }) =>
      baseApi.put(`blocks/sections/${sectionId}`, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["sections", data.id] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
};
