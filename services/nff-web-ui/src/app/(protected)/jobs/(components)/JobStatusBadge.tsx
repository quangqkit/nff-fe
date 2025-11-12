import { JobStatus } from '@/types';
import { JOB_STATUS_LABELS, JOB_STATUS_COLORS } from '@/constants/job.constants';
import { cn } from '@/lib/utils';

interface JobStatusBadgeProps {
  status: JobStatus;
}

export function JobStatusBadge({ status }: JobStatusBadgeProps) {
  return (
    <span
      className={cn(
        'px-3 py-1 text-xs font-medium rounded-full border',
        JOB_STATUS_COLORS[status]
      )}
    >
      {JOB_STATUS_LABELS[status]}
    </span>
  );
}

