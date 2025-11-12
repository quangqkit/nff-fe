import { IndicatorLogStatus } from '@/types';

export const INDICATOR_STATUS_LABELS: Record<IndicatorLogStatus, string> = {
  UNKNOWN: 'Unknown',
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  OK: 'Success',
  ERROR: 'Error',
  BLOCKED: 'Blocked',
  STALE: 'Stale',
};

export const INDICATOR_STATUS_COLORS: Record<IndicatorLogStatus, string> = {
  UNKNOWN: 'bg-gray-100 text-gray-700 border-gray-200',
  PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  PROCESSING: 'bg-blue-100 text-blue-700 border-blue-200',
  OK: 'bg-green-100 text-green-700 border-green-200',
  ERROR: 'bg-red-100 text-red-700 border-red-200',
  BLOCKED: 'bg-orange-100 text-orange-700 border-orange-200',
  STALE: 'bg-gray-100 text-gray-600 border-gray-200',
};

