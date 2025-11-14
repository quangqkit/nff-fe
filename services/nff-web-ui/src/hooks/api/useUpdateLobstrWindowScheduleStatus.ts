import { useMutation, useQueryClient } from "@tanstack/react-query";

import { baseApi } from "@/lib/api/base";
import { QUERY_KEYS } from "@/lib/query/query-client";

interface UpdateLobstrWindowScheduleStatusInput {
  id: number;
  isActive: boolean;
}

export function useUpdateLobstrWindowScheduleStatus() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, UpdateLobstrWindowScheduleStatusInput>({
    mutationFn: ({ id, isActive }) =>
      baseApi.patch<void>(`/lobstr/window-schedules/${id}/status`, {
        isActive,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.LOBSTR.WINDOW_SCHEDULES(),
      });
    },
  });
}
