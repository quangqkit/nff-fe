import { IndicatorLog } from '@/types';
import { INDICATOR_STATUS_LABELS, INDICATOR_STATUS_COLORS } from '@/constants/indicator-log.constants';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface IndicatorLogDialogProps {
  log: IndicatorLog | null;
  open: boolean;
  onClose: () => void;
}

export function IndicatorLogDialog({ log, open, onClose }: IndicatorLogDialogProps) {
  if (!log) return null;

  const parseApiExample = (apiExample?: string) => {
    if (!apiExample) return 'N/A';
    try {
      const match = apiExample.match(/observation_start=([^&]+)/);
      if (match) return match[1];
      
      const startMatch = apiExample.match(/start_date=([^&]+)/);
      if (startMatch) return startMatch[1];
      
      return 'N/A';
    } catch {
      return 'N/A';
    }
  };

  const parseFileType = (apiExample?: string) => {
    if (!apiExample) return 'JSON';
    return apiExample.includes('file_type=') ? 
      apiExample.match(/file_type=([^&]+)/)?.[1]?.toUpperCase() || 'JSON' : 
      'JSON';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Job Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-slate-500">Indicator Name</div>
              <div className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {log.indicatorName}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-slate-500">Category</div>
              <div className="text-base text-slate-900 dark:text-slate-100">
                {log.categoryName}
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-slate-500">Status</div>
              <Badge className={cn('mt-1', INDICATOR_STATUS_COLORS[log.status])}>
                {INDICATOR_STATUS_LABELS[log.status]}
              </Badge>
            </div>
            <div>
              <div className="text-sm font-medium text-slate-500">Job ID</div>
              <div className="text-sm font-mono text-slate-700 dark:text-slate-300">
                {log.jobId}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-slate-500">Created At</div>
              <div className="text-sm text-slate-700 dark:text-slate-300">
                {new Date(log.createdAt).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-slate-500">Completed At</div>
              <div className="text-sm text-slate-700 dark:text-slate-300">
                {log.completedAt ? new Date(log.completedAt).toLocaleString() : 'N/A'}
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-medium text-slate-500 mb-2">Parameters</div>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">API Source:</span>
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {log.apiSource}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Series ID:</span>
                <span className="text-sm font-mono font-medium text-slate-900 dark:text-slate-100">
                  {log.seriesId || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Start Date:</span>
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {parseApiExample(log.apiExample)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">File Type:</span>
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {parseFileType(log.apiExample)}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
              <div className="text-xs text-green-600 dark:text-green-400">Inserted</div>
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                {log.recordsInserted}
              </div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
              <div className="text-xs text-blue-600 dark:text-blue-400">Updated</div>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {log.recordsUpdated}
              </div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
              <div className="text-xs text-purple-600 dark:text-purple-400">Processed</div>
              <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                {log.recordsProcessed}
              </div>
            </div>
          </div>

          {log.errorMessage && (
            <>
              <Separator />
              <div>
                <div className="text-sm font-medium text-red-600 mb-2">Error Log</div>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="text-sm text-red-700 dark:text-red-300 whitespace-pre-wrap">
                    {log.errorMessage}
                  </div>
                  {log.errorCode && (
                    <div className="text-xs text-red-600 dark:text-red-400 mt-2">
                      Error Code: {log.errorCode}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

