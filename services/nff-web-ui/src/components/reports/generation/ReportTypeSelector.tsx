import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle } from 'lucide-react';
import type { ReportType } from '@/types';

interface ReportTypeSelectorProps {
  reportTypes: ReportType[];
  selectedReportType: string;
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
  onReportTypeChange: (value: string) => void;
  onGenerateReport: () => void;
}

export function ReportTypeSelector({
  reportTypes,
  selectedReportType,
  isLoading,
  isGenerating,
  error,
  onReportTypeChange,
  onGenerateReport,
}: ReportTypeSelectorProps) {
  return (
    <div className="mb-8 p-6 border rounded-lg bg-card">
      <h2 className="text-2xl font-semibold mb-4">Generate New Report</h2>
      
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-2">Select Report Type</label>
          {error ? (
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          ) : (
            <Select
              value={selectedReportType}
              onValueChange={onReportTypeChange}
              disabled={isLoading || isGenerating}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a report type..." />
              </SelectTrigger>
              <SelectContent>
                {isLoading ? (
                  <SelectItem value="loading" disabled>
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Loading report types...</span>
                    </div>
                  </SelectItem>
                ) : reportTypes.length === 0 ? (
                  <SelectItem value="empty" disabled>
                    No report types available
                  </SelectItem>
                ) : (
                  reportTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          )}
        </div>

        <Button
          onClick={onGenerateReport}
          disabled={!selectedReportType || isGenerating || isLoading}
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            'Generate Report'
          )}
        </Button>
      </div>
    </div>
  );
}



