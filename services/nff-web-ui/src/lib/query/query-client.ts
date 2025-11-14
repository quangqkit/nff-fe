import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: (failureCount, error: any) => {
        if (error?.status === 404 || error?.status === 401) {
          return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: false,
    },
  },
});

export const QUERY_KEYS = {
  REPORTS: {
    ALL: ["reports"] as const,
    LIST: (filters?: Record<string, unknown>) =>
      ["reports", "list", filters] as const,
    DETAIL: (id: string) => ["reports", "detail", id] as const,
    WITH_BLOCKS: (id: string) => ["reports", "with-blocks", id] as const,
    PREVIEW: (id: string) => ["reports", "preview", id] as const,
    TYPES: () => ["report-types"] as const,
    EXPORT: (id: string, format: string) =>
      ["reports", "export", id, format] as const,
  },
  SECTIONS: {
    ALL: ["sections"] as const,
    LIST: (reportId: string) => ["sections", "list", reportId] as const,
    DETAIL: (reportId: string, sectionId: string) =>
      ["sections", "detail", reportId, sectionId] as const,
  },
  CHARTS: {
    ALL: ["charts"] as const,
    LIST: (filters?: Record<string, unknown>) =>
      ["charts", "list", filters] as const,
    DETAIL: (id: string) => ["charts", "detail", id] as const,
  },
  INDICATORS: {
    ALL: ["indicators"] as const,
    LIST: (filters?: Record<string, unknown>) =>
      ["indicators", "list", filters] as const,
    DETAIL: (id: string) => ["indicators", "detail", id] as const,
    CONFIG: (id: string) => ["indicators", "config", id] as const,
    DATA: (id: string, params?: Record<string, unknown>) =>
      ["indicators", "data", id, params] as const,
  },
  LOBSTR: {
    WINDOW_SCHEDULES: () => ["lobstr", "window-schedules"] as const,
  },
  JOBS: {
    ALL: ["jobs"] as const,
    LIST: (filters?: Record<string, unknown>) =>
      ["jobs", "list", filters] as const,
    DETAIL: (id: string) => ["jobs", "detail", id] as const,
    LOGS: (id: string) => ["jobs", "logs", id] as const,
  },
  AUTH: {
    PROFILE: ["auth", "profile"] as const,
  },
} as const;
