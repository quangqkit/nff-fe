export interface LobstrSchedule {
  id?: number;
  scheduleId: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  cronExpression?: string | null;
  timezone: string;
  lookbackHours: number;
  keywords: string[];
  accounts: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LobstrRun {
  id?: number;
  scheduleId: number;
  runId: string;
  runType: 'auto' | 'manual';
  status: 'pending' | 'running' | 'completed' | 'failed';
  windowStart: Date;
  windowEnd: Date;
  tweetsFetched: number;
  tweetsProcessed: number;
  tweetsDropped: number;
  errors?: any;
  metadata?: any;
  startedAt?: Date;
  completedAt?: Date;
  durationMs?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LobstrTweet {
  id?: number;
  runId: number;
  tweetId: string;
  externalId?: string;
  authorId?: string;
  authorHandle?: string;
  text: string;
  language?: string;
  createdAt: Date;
  fetchedAt?: Date;
  isReply: boolean;
  isRetweet: boolean;
  publicMetrics?: any;
  urls?: any;
  symbols: string[];
  hashtags: string[];
  mentions: string[];
  rawData?: any;
}

export interface LobstrApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  pagination?: {
    nextToken?: string;
    hasMore: boolean;
  };
}

export interface LobstrSquid {
  id: string;
  name: string;
  created_at: string;
  is_ready: boolean;
  is_active: boolean;
  concurrency: number;
  params: {
    json: boolean;
    hours_back: number;
    max_results: number | null;
    exclude_reposts: boolean;
    collect_pinned_tweets: boolean;
    max_unique_results_per_run: number | null;
  };
  schedule: string;
  cron_expression: string;
  accounts: Array<{
    id: string;
    status: string;
  }>;
  timezone: string;
  schedule_name: string;
  next_run_at: string;
  crawler: string;
  crawler_name: string;
  total_runs: number;
  last_run: string;
  last_run_at: string;
  last_run_status: string;
  last_run_done_reason: string;
  last_run_is_done: boolean;
  is_public: boolean;
}

export interface LobstrSquidsListResponse {
  total_results: number;
  limit: number;
  page: number;
  total_pages: number;
  result_from: number;
  result_to: number;
  data: LobstrSquid[];
}

export interface LobstrSquidDetailsResponse {
  id: string;
  name: string;
  description?: string;
  status: string;
  created_at: string;
  updated_at: string;
  configuration: {
    keywords?: string[];
    accounts?: string[];
    filters?: any;
    settings?: any;
  };
  crawler: {
    type: string;
    settings: any;
  };
  delivery: {
    type: string;
    settings: any;
  };
  statistics: {
    total_runs: number;
    successful_runs: number;
    failed_runs: number;
    last_run?: string;
  };
  runs?: any[];
}

export interface LobstrSquidData {
  tweets: any[];
  metadata: {
    totalCount: number;
    fetchedAt: Date;
    windowStart: Date;
    windowEnd: Date;
  };
}

export interface CreateScheduleDto {
  scheduleId: string;
  name: string;
  description?: string;
  cronExpression?: string;
  timezone?: string;
  lookbackHours?: number;
  keywords?: string[];
  accounts?: string[];
}

export interface CreateRunDto {
  scheduleId: number;
  runType: 'auto' | 'manual';
  windowStart: Date;
  windowEnd: Date;
  metadata?: any;
}

export interface TriggerRunDto {
  squidId: string;
  startDate?: Date;
  endDate?: Date;
  metadata?: any;
}

export interface LobstrRunResponse {
  id: string;
  status: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  squid_id: string;
  window_start?: string;
  window_end?: string;
  metadata?: any;
}

export interface LobstrRunItem {
  id: string;
  object: string;
  created_at: string;
  started_at?: string;
  next_launch_at?: string;
  ended_at?: string;
  duration?: number;
  credit_used?: number;
  origin: string;
  status: string;
  export_count?: number;
  export_time?: string;
}

export interface LobstrRunsListResponse {
  total_results: number;
  limit: number;
  page: number;
  total_pages: number;
  result_from: number;
  result_to: number;
  data: LobstrRunItem[];
}

export interface LobstrRunDetailResponse {
  id: string;
  object: string;
  created_at: string;
  started_at?: string;
  next_launch_at?: string;
  ended_at?: string;
  duration?: number;
  credit_used?: number;
  origin: string;
  status: string;
}

export interface LobstrDownloadResponse {
  s3: string;
  download_url?: string;
}

export enum LobstrErrorCode {
  RATE_LIMIT = 'RATE_LIMIT',
  AUTHENTICATION = 'AUTHENTICATION',
  VALIDATION = 'VALIDATION',
  SERVER_ERROR = 'SERVER_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN = 'UNKNOWN',
}

export interface LobstrErrorResponse {
  code: string;
  message: string;
  details?: any;
  request_id?: string;
}

export interface RequestMetadata {
  endpoint: string;
  request_id: string;
  status_code: number;
  response_body: any;
  timestamp: Date;
  error_code?: LobstrErrorCode;
  retry_count: number;
}

export interface RetryConfig {
  max_attempts: number;
  base_delay_ms: number;
  max_delay_ms: number;
  backoff_multiplier: number;
}

export interface LobstrRetryContext {
  attempt: number;
  last_error_code?: LobstrErrorCode;
  consecutive_same_errors: number;
  last_request_metadata?: RequestMetadata;
}

export interface LobstrTask {
  url: string;
}

export interface LobstrAddTasksRequest {
  tasks: LobstrTask[];
  squid: string;
}

export interface LobstrTaskResponse {
  id: string;
  created_at: string;
  is_active: boolean;
  params: {
    url: string;
  };
}

export interface LobstrAddTasksResponse {
  duplicated_count: number;
  tasks: LobstrTaskResponse[];
}

export interface LobstrGetTasksResponse {
  data: LobstrTaskResponse[];
  total_results: number;
  limit: number;
  page: number;
  total_pages: number;
}