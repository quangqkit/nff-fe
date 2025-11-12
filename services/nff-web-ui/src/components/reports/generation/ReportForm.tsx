import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { REPORT_UI_TEXT } from "@/constants/reports";

interface ReportTypeData {
  id: number;
  name: string;
  description?: string;
}

interface ReportFormProps {
  reportTypes: ReportTypeData[];
  selectedReportType: string;
  isLoading: boolean;
  error: string | null;
  isGenerating: boolean;
  onReportTypeChange: (value: string) => void;
  onGenerate: () => void;
  onRetry: () => void;
}

export const ReportForm = ({
  reportTypes,
  selectedReportType,
  isLoading,
  error,
  isGenerating,
  onReportTypeChange,
  onGenerate,
  onRetry,
}: ReportFormProps) => {
  return (
    <Card className="flex-shrink-0">
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="flex-1">
            <Select
              value={selectedReportType}
              onValueChange={onReportTypeChange}
              disabled={isLoading || !!error}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    isLoading
                      ? REPORT_UI_TEXT.MESSAGES.LOADING_REPORT_TYPES
                      : error
                      ? REPORT_UI_TEXT.ERRORS.FAILED_LOAD_REPORT_TYPES
                      : REPORT_UI_TEXT.PLACEHOLDERS.REPORT_TYPE
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span className="text-sm text-black">
                      {REPORT_UI_TEXT.MESSAGES.LOADING_REPORT_TYPES}
                    </span>
                  </div>
                ) : (
                  reportTypes
                    .sort((a, b) => a.id - b.id)
                    .map((reportType) => (
                      <SelectItem key={reportType.id} value={reportType.name}>
                        {reportType.name}
                      </SelectItem>
                    ))
                )}
              </SelectContent>
            </Select>

            {error && (
              <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span>{REPORT_UI_TEXT.ERRORS.FAILED_LOAD_REPORT_TYPES}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRetry}
                  className="h-6 px-2 text-red-600 hover:text-red-700"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
              </div>
            )}
          </div>

          <Button
            onClick={onGenerate}
            disabled={
              !selectedReportType || isGenerating || isLoading || !!error
            }
            className="w-full sm:w-auto"
            variant="default"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {REPORT_UI_TEXT.BUTTONS.GENERATING}
              </>
            ) : (
              REPORT_UI_TEXT.BUTTONS.GENERATE
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
