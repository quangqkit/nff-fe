import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Plus } from 'lucide-react';
import { BlockData, ReportSection } from "@/types/reports";
import { ChartData, SectionData } from "@/types";
import { SectionEditor } from "./SectionEditor";
import { REPORT_UI_TEXT } from "@/constants/reports";

interface ReportEditorProps {
  sections: ReportSection[];
  sectionsData: Record<number, SectionData>;
  sectionStates: Record<number, boolean>;
  editingSection: number | null;
  isAddingNewSection: boolean;
  onSectionTitleChange: (sectionId: number, title: string) => void;
  onStartSectionEdit: (sectionId: number) => void;
  onSaveSectionTitle: (sectionId: number) => void;
  onCancelSectionEdit: (sectionId: number) => void;
  onClearSectionTitle: (sectionId: number) => void;
  onToggleSection: (sectionId: number) => void;
  onAddBlock: (sectionId: number) => void;
  onAddSection: () => void;
  onToggleBlock: (blockId: number) => void;
  onEditBlock: (block: any) => void;
  onDuplicateBlock: (block: any) => void;
  onDeleteBlock: (blockId: number) => void;
  onExportChartJson: (chart: any) => void;
  isPreviewMode?: boolean;
}

export const ReportEditor = ({
  sections,
  sectionsData,
  sectionStates,
  editingSection,
  isAddingNewSection,
  onSectionTitleChange,
  onStartSectionEdit,
  onSaveSectionTitle,
  onCancelSectionEdit,
  onClearSectionTitle,
  onToggleSection,
  onAddBlock,
  onAddSection,
  onToggleBlock,
  onEditBlock,
  onDuplicateBlock,
  onDeleteBlock,
  onExportChartJson,
  isPreviewMode = false,
}: ReportEditorProps) => {
  return (
    <Card className="h-full border-0">
      <CardContent className="h-full flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-6 min-h-0 max-h-[70vh] hide-scrollbar">
          {sections.map((section) => {
            const sectionData = sectionsData[section.id];
            const blocks = [
              ...(sectionData?.blocks || []),
              ...(sectionData?.charts || []).map((chart) => chart as any),
            ];

            return (
              <SectionEditor
                key={section.id}
                section={section}
                isEditing={editingSection === section.id}
                isEnabled={sectionStates[section.id] ?? true}
                onTitleChange={(title) =>
                  onSectionTitleChange(section.id, title)
                }
                onStartEdit={() => onStartSectionEdit(section.id)}
                onSave={() => onSaveSectionTitle(section.id)}
                onCancel={() => onCancelSectionEdit(section.id)}
                onClear={() => onClearSectionTitle(section.id)}
                onToggleEnabled={() => onToggleSection(section.id)}
                onAddBlock={() => onAddBlock(section.id)}
                blocks={blocks as (BlockData | ChartData)[]}
                onToggleBlock={onToggleBlock}
                onEditBlock={onEditBlock}
                onDuplicateBlock={onDuplicateBlock}
                onDeleteBlock={onDeleteBlock}
                onExportChartJson={onExportChartJson}
                isPreviewMode={isPreviewMode}
              />
            );
          })}

          {!isPreviewMode && (
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                className="w-fit"
                onClick={onAddSection}
                disabled={isAddingNewSection}
              >
                {isAddingNewSection ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {REPORT_UI_TEXT.BUTTONS.ADDING_SECTION}
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    {REPORT_UI_TEXT.BUTTONS.ADD_SECTION}
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
