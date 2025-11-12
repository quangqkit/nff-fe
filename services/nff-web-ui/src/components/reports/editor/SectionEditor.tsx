import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { REPORT_UI_TEXT } from "@/constants/reports";
import { MAIN_COLOR } from "@/constants/colors";
import { BlockData, ChartData } from "@/types";
import { ReportSection } from "@/types/reports";
import { Edit, Plus, X } from "lucide-react";
import { BlockTable } from "./BlockTable";

interface SectionEditorProps {
  section: ReportSection;
  isEditing: boolean;
  isEnabled: boolean;
  onTitleChange: (value: string) => void;
  onStartEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onClear: () => void;
  onToggleEnabled: () => void;
  onAddBlock: () => void;
  blocks?: (BlockData | ChartData)[];
  onToggleBlock?: (blockId: number) => void;
  onEditBlock?: (block: BlockData) => void;
  onDuplicateBlock?: (block: any) => void;
  onDeleteBlock?: (blockId: number) => void;
  onExportChartJson?: (chart: ChartData) => void;
  isPreviewMode?: boolean;
}

export const SectionEditor = ({
  section,
  isEditing,
  isEnabled,
  onTitleChange,
  onStartEdit,
  onSave,
  onCancel,
  onClear,
  onToggleEnabled,
  onAddBlock,
  blocks = [],
  onToggleBlock,
  onEditBlock,
  onDuplicateBlock,
  onDeleteBlock,
  onExportChartJson,
  isPreviewMode = false,
}: SectionEditorProps) => {
  return (
    <div className="bg-card">
      <div className="">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Input
              value={section.title}
              onChange={(e) => onTitleChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSave();
                if (e.key === "Escape") onCancel();
              }}
              className="text-lg font-semibold bg-transparent border-0 border-b-2 rounded-none outline-none w-full text-[#707FDD] focus:ring-0 focus:border-b-2 focus:border-[#707FDD]"
              style={{ borderBottomColor: MAIN_COLOR }}
              autoFocus
            />
            <Button
              onClick={onClear}
              variant="ghost"
              size="icon"
              title="Clear input"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button onClick={onSave} variant="default">
              {REPORT_UI_TEXT.BUTTONS.SAVE}
            </Button>
            <Button onClick={onCancel} variant="outline">
              {REPORT_UI_TEXT.BUTTONS.CANCEL}
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold flex-1 !text-[#707FDD] rounded-md">
              {section.title}
            </h3>
            {!isPreviewMode && (
              <Button onClick={onStartEdit} variant="ghost" size="icon">
                <Edit className="h-4 w-4 text-muted-foreground" />
              </Button>
            )}
          </div>
        )}
      </div>

      {!isPreviewMode && (
        <div className="flex items-center justify-between rounded-lg">
          <div className="flex items-center gap-4">
            <Switch checked={isEnabled} onCheckedChange={onToggleEnabled} />
            <span className="text-sm text-muted-foreground font-medium">
              {REPORT_UI_TEXT.MESSAGES.SWITCH_SECTION}
            </span>
          </div>
          <Button
            variant="default"
            size="sm"
            onClick={onAddBlock}
            className="cursor-pointer shadow-sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            {REPORT_UI_TEXT.BUTTONS.ADD_NEW_BLOCK}
          </Button>
        </div>
      )}

      <div className="mt-4">
        <BlockTable
          blocks={blocks}
          onToggleBlock={onToggleBlock || (() => {})}
          onEditBlock={onEditBlock || (() => {})}
          onDuplicateBlock={onDuplicateBlock || (() => {})}
          onDeleteBlock={onDeleteBlock || (() => {})}
          onExportChartJson={onExportChartJson || (() => {})}
          isPreviewMode={isPreviewMode}
        />
      </div>
    </div>
  );
};
