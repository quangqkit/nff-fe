"use client";

import { useQuery } from "@tanstack/react-query";

import { baseApi } from "@/lib/api/base";
import { QUERY_KEYS } from "@/lib/query/query-client";
import { LobstrWindowSchedule } from "@/types";

export function useLobstrWindowSchedules() {
  return useQuery<LobstrWindowSchedule[]>({
    queryKey: QUERY_KEYS.LOBSTR.WINDOW_SCHEDULES(),
    queryFn: () =>
      baseApi.get<LobstrWindowSchedule[]>("/lobstr/window-schedules"),
  });
}

