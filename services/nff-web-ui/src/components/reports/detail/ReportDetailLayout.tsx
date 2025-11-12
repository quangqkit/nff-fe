import { Button } from "@/components/ui/button";
import { Trash2, FileText, Download, Loader2 } from "lucide-react";
import { ReportTitleEditor } from "../editor/ReportTitleEditor";
import { ReportSummaryEditor } from "../editor/ReportSummaryEditor";
import { ReportEditor } from "../editor/ReportEditor";
import { ReportPreview } from "./ReportPreview";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { HtmlExportDialog } from "@/app/(protected)/reports/(components)/HtmlExportDialog";
import { REPORT_UI_TEXT } from "@/constants/reports";
import { GeneratedReport } from "@/types/reports";
import { SectionData } from "@/types";

interface ReportDetailLayoutProps {
  generatedReport: GeneratedReport;
  sectionsData: Record<number, SectionData>;
  sectionStates: Record<number, boolean>; 
  livePreviewKey: number;
  reportTitle: string;
  reportSummary: string;
  isEditingTitle: boolean;
  isSavingTitle: boolean;
  isSavingSummary: boolean;
  editingSection: number | null;
  isAddingNewSection: boolean;
  blockToDelete: number | null;
  showDeleteDialog: boolean;
  showHtmlExportDialog: boolean;
  isExporting: boolean;
  isDeleting: boolean;
  onTitleChange: (value: string) => void;
  onStartEdit: () => void;
  onSaveTitle: () => void;
  onCancelTitleEdit: () => void;
  onClearTitle: () => void;
  onSummaryChange: (value: string) => void;
  onSaveSummary: () => void;
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
  onDeleteReport: () => void;
  onConvertToHtml: () => void;
  onExportReport: () => void;
  onSetBlockToDelete: (blockId: number | null) => void;
  onSetShowDeleteDialog: (show: boolean) => void;
  onSetShowHtmlExportDialog: (show: boolean) => void;
  isPreviewMode?: boolean;
  reportInfo?: string;
  reportId?: string;
}

export const ReportDetailLayout = ({
  generatedReport,
  sectionsData,
  sectionStates,
  livePreviewKey,
  reportTitle,
  reportSummary,
  isEditingTitle,
  isSavingTitle,
  isSavingSummary,
  editingSection,
  isAddingNewSection,
  blockToDelete,
  showDeleteDialog,
  showHtmlExportDialog,
  isExporting,
  isDeleting,
  onTitleChange,
  onStartEdit,
  onSaveTitle,
  onCancelTitleEdit,
  onClearTitle,
  onSummaryChange,
  onSaveSummary,
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
  onDeleteReport,
  onConvertToHtml,
  onExportReport,
  onSetBlockToDelete,
  onSetShowDeleteDialog,
  onSetShowHtmlExportDialog,
  isPreviewMode = false,
  reportInfo,
  reportId,
}: ReportDetailLayoutProps) => {

  return (
    <>
      <div className="h-[calc(100vh-105px)] flex flex-col gap-2">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 mr-2">
              <ReportTitleEditor
                reportTitle={reportTitle}
                isEditing={isEditingTitle}
                isSaving={isSavingTitle}
                onTitleChange={onTitleChange}
                onStartEdit={onStartEdit}
                onSave={onSaveTitle}
                onCancel={onCancelTitleEdit}
                onClear={onClearTitle}
                isPreviewMode={isPreviewMode}
                reportInfo={reportInfo}
              />
            </div>

            {!isPreviewMode && (
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => onSetShowDeleteDialog(true)}
                  disabled={isExporting || isDeleting}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950 dark:border-red-400 border-red-600 cursor-pointer rounded-md h-10"
                >
                  <Trash2 className="h-5 w-5 mr-2" />
                  {REPORT_UI_TEXT.BUTTONS.DELETE}
                </Button>

                <Button
                  variant="outline"
                  size="default"
                  onClick={onConvertToHtml}
                  disabled={isDeleting}
                  className="cursor-pointer rounded-md h-10"
                >
                  <FileText className="h-5 w-5 mr-2" />
                  {REPORT_UI_TEXT.BUTTONS.CONVERT_HTML}
                </Button>

                <Button
                  variant="default"
                  size="default"
                  onClick={onExportReport}
                  disabled={isExporting || isDeleting}
                  className="cursor-pointer rounded-md h-10"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      {REPORT_UI_TEXT.BUTTONS.EXPORTING}
                    </>
                  ) : (
                    <>
                      <Download className="h-5 w-5 mr-2" />
                      {REPORT_UI_TEXT.BUTTONS.EXPORT_REPORT}
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>

        <ReportSummaryEditor
          reportSummary={reportSummary}
          isSaving={isSavingSummary}
          onSummaryChange={onSummaryChange}
          onSave={onSaveSummary}
          isPreviewMode={isPreviewMode}
        />

        <div
          className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-2"
          style={{ height: "calc(100% - 0px)", minHeight: 0 }}
        >
          <div className="min-h-0">
            <ReportEditor
              sections={generatedReport.sections}
              sectionsData={sectionsData}
              sectionStates={sectionStates}
              editingSection={editingSection}
              isAddingNewSection={isAddingNewSection}
              onSectionTitleChange={onSectionTitleChange}
              onStartSectionEdit={onStartSectionEdit}
              onSaveSectionTitle={onSaveSectionTitle}
              onCancelSectionEdit={onCancelSectionEdit}
              onClearSectionTitle={onClearSectionTitle}
              onToggleSection={onToggleSection}
              onAddBlock={onAddBlock}
              onAddSection={onAddSection}
              onToggleBlock={onToggleBlock}
              onEditBlock={onEditBlock}
              onDuplicateBlock={onDuplicateBlock}
              onDeleteBlock={(blockId) => onSetBlockToDelete(blockId)}
              onExportChartJson={onExportChartJson}
              isPreviewMode={isPreviewMode}
            />
          </div>

          <div className="flex-1 min-h-[300px]">
            <ReportPreview
              generatedReport={generatedReport}
              sectionsData={sectionsData}
              livePreviewKey={livePreviewKey}
              isPreviewMode={isPreviewMode}
              onEditBlock={onEditBlock}
            />
          </div>
        </div>
      </div>

      <HtmlExportDialog
        isOpen={showHtmlExportDialog}
        onClose={() => onSetShowHtmlExportDialog(false)}
        reportId={reportId ? parseInt(reportId) : 0}
        reportTitle={reportTitle || generatedReport.type || "Report"}
      />

      <ConfirmDialog
        isOpen={!!blockToDelete}
        onClose={() => onSetBlockToDelete(null)}
        onConfirm={() => blockToDelete && onDeleteBlock(blockToDelete)}
        title="Delete Block"
        description="Are you sure you want to delete this block? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => onSetShowDeleteDialog(false)}
        onConfirm={onDeleteReport}
        title="Delete Report"
        description="Are you sure you want to delete this report? This action cannot be undone and will delete all sections and blocks associated with this report."
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isDeleting}
        variant="destructive"
      />
    </>
  );
};
