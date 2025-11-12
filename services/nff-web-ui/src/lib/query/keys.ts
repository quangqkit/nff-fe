export const queryKeys = {
  auth: {
    all: ["auth"] as const,
    me: () => [...queryKeys.auth.all, "me"] as const,
  },

  reports: {
    all: ["reports"] as const,
    lists: () => [...queryKeys.reports.all, "list"] as const,
    list: (filters?: any) => [...queryKeys.reports.lists(), filters] as const,
    details: () => [...queryKeys.reports.all, "detail"] as const,
    detail: (id: number) => [...queryKeys.reports.details(), id] as const,
    withBlocks: (id: number) =>
      [...queryKeys.reports.detail(id), "blocks"] as const,
    preview: (id: number) =>
      [...queryKeys.reports.detail(id), "preview"] as const,
    types: ["report-types"] as const,
  },

  sections: {
    all: ["sections"] as const,
    detail: (reportId: number, sectionId: number) =>
      [...queryKeys.sections.all, reportId, sectionId] as const,
    byReport: (reportId: number) =>
      [...queryKeys.sections.all, reportId] as const,
  },

  blocks: {
    all: ["blocks"] as const,
    detail: (id: number) => [...queryKeys.blocks.all, id] as const,
    bySection: (sectionId: number) =>
      [...queryKeys.blocks.all, "section", sectionId] as const,
  },

  charts: {
    all: ["charts"] as const,
    detail: (id: number) => [...queryKeys.charts.all, id] as const,
    bySection: (sectionId: number) =>
      [...queryKeys.charts.all, "section", sectionId] as const,
  },

  indicators: {
    all: ["indicators"] as const,
    lists: () => [...queryKeys.indicators.all, "list"] as const,
    list: (filters?: any) =>
      [...queryKeys.indicators.lists(), filters] as const,
    details: () => [...queryKeys.indicators.all, "detail"] as const,
    detail: (id: number) => [...queryKeys.indicators.details(), id] as const,
    byCategory: (categoryId: number) =>
      [...queryKeys.indicators.all, "category", categoryId] as const,
    config: (id: number) =>
      [...queryKeys.indicators.detail(id), "config"] as const,
    data: (id: number, params?: any) =>
      [...queryKeys.indicators.detail(id), "data", params] as const,
  },

  exports: {
    all: ["exports"] as const,
    status: (id: number) => [...queryKeys.exports.all, "status", id] as const,
  },

  jobs: {
    all: ["jobs"] as const,
    lists: () => [...queryKeys.jobs.all, "list"] as const,
    list: (filters?: any) => [...queryKeys.jobs.lists(), filters] as const,
    detail: (id: string) => [...queryKeys.jobs.all, id] as const,
    logs: (id: string) => [...queryKeys.jobs.detail(id), "logs"] as const,
  },
} as const;
