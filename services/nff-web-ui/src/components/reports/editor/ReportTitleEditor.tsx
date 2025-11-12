import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { REPORT_UI_TEXT } from "@/constants/reports";
import { Edit, Loader2, X } from "lucide-react";

interface ReportTitleEditorProps {
  reportTitle: string;
  isEditing: boolean;
  isSaving: boolean;
  onTitleChange: (value: string) => void;
  onStartEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onClear: () => void;
  isPreviewMode?: boolean;
  reportInfo?: string;
}

export const ReportTitleEditor = ({
  reportTitle,
  isEditing,
  isSaving,
  onTitleChange,
  onStartEdit,
  onSave,
  onCancel,
  onClear,
  isPreviewMode = false,
  reportInfo,
}: ReportTitleEditorProps) => {
  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          value={reportTitle}
          onChange={(e) => onTitleChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSave();
            if (e.key === "Escape") onCancel();
          }}
          className="text-2xl font-bold text-[#707FDD] bg-transparent border-0 border-b-2 border-[#707FDD] rounded-none outline-none w-full focus:ring-0 focus:border-b-2 focus:border-[#707FDD]"
          autoFocus
          disabled={isSaving}
        />
        <Button
          onClick={onClear}
          disabled={isSaving}
          variant="ghost"
          size="icon"
          title="Clear input"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </Button>
        <Button onClick={onSave} disabled={isSaving} variant="default">
          {REPORT_UI_TEXT.BUTTONS.SAVE}
        </Button>
        <Button onClick={onCancel} disabled={isSaving} variant="outline">
          {REPORT_UI_TEXT.BUTTONS.CANCEL}
        </Button>
        {isSaving && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3  mt-0">
      <h1 className="text-2xl font-bold text-[#707FDD]">
        {isPreviewMode && reportInfo ? reportInfo : reportTitle}
      </h1>
      {!isPreviewMode && (
        <Button onClick={onStartEdit} variant="ghost" size="icon">
          <Edit className="h-4 w-4 text-muted-foreground" />
        </Button>
      )}
    </div>
  );
};
