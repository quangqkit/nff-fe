import { Loader2 } from "lucide-react";
import { REPORT_UI_TEXT } from "@/constants/reports";

interface ReportSummaryEditorProps {
  reportSummary: string;
  isSaving: boolean;
  onSummaryChange: (value: string) => void;
  onSave: () => void;
  isPreviewMode?: boolean;
}

export const ReportSummaryEditor = ({
  reportSummary,
  isSaving,
  onSummaryChange,
  onSave,
  isPreviewMode = false,
}: ReportSummaryEditorProps) => {
  if (isPreviewMode) {
    return null;
  }

  return (
    <div className="relative">
      <textarea
        value={reportSummary}
        onChange={(e) => onSummaryChange(e.target.value)}
        onBlur={onSave}
        onKeyDown={(e) => {
          if (e.key === "Enter" && e.ctrlKey) {
            onSave();
          }
          if (e.key === "Escape") {
            onSummaryChange("");
          }
        }}
        placeholder={REPORT_UI_TEXT.PLACEHOLDERS.REPORT_SUMMARY}
        className="w-full border border-border bg-card text-foreground px-6 py-3 rounded-md resize-none shadow-sm min-h-[100px] outline-none"
        rows={3}
        disabled={isSaving}
      />
      {isSaving && (
        <div className="absolute top-2 right-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        </div>
      )}
    </div>
  );
};
