import { JobStatus } from '@/types';

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  PROCESSING: 'Running',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
};

export const JOB_STATUS_COLORS: Record<JobStatus, string> = {
  PROCESSING: 'text-blue-600 bg-blue-50 border-blue-200',
  COMPLETED: 'text-green-600 bg-green-50 border-green-200',
  FAILED: 'text-red-600 bg-red-50 border-red-200',
};

export const JOB_REFRESH_INTERVAL = 5000;

export const DEFAULT_PAGE_SIZE = 10;

