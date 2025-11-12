export type JobStatus = "PROCESSING" | "COMPLETED" | "FAILED";
export type IndicatorLogStatus =
  | "UNKNOWN"
  | "PENDING"
  | "PROCESSING"
  | "OK"
  | "ERROR"
  | "BLOCKED"
  | "STALE";

export interface JobMetadata {
  category?: string;
  source?: string;
  force_refresh?: boolean;
  indicator_ids?: number[];
  type?: string;
  start_date?: string;
  end_date?: string;
  importance_min?: number;
  days_back?: number;
}

export interface Job {
  jobId: string;
  status: JobStatus;
  totalIndicators: number;
  successful: number;
  failed: number;
  blocked: number;
  startedAt: string;
  completedAt?: string;
  durationSeconds?: number;
  metadata?: JobMetadata;
  createdAt: string;
}

export interface JobSummary {
  total: number;
  processing: number;
  completed: number;
  failed: number;
}

export interface JobListResponse {
  jobs: Job[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary: JobSummary;
}

export interface JobLog {
  id: number;
  indicatorId: number;
  indicatorName: string;
  status: string;
  errorCode?: string;
  errorMessage?: string;
  errorCategory?: string;
  recordsProcessed: number;
  recordsInserted: number;
  recordsUpdated: number;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  metadata?: any;
}

export interface JobLogsResponse {
  success: boolean;
  jobId: string;
  logs: JobLog[];
}

export interface JobStatsResponse {
  success: boolean;
  stats: JobSummary;
}

export interface IndicatorLog {
  id: number;
  indicatorId: number;
  indicatorName: string;
  categoryName: string;
  jobId: string;
  status: IndicatorLogStatus;
  errorCode?: string;
  errorMessage?: string;
  errorCategory?: string;
  recordsProcessed: number;
  recordsInserted: number;
  recordsUpdated: number;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  metadata?: any;
  apiSource: string;
  seriesId?: string;
  apiExample?: string;
}

export interface IndicatorLogsResponse {
  success: boolean;
  logs: IndicatorLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
