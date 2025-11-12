"use client";

import { useState, useEffect, useCallback } from "react";
import { CustomTabs, createReportTabs } from "@/components/ui/custom-tabs";
import { Card, CardContent } from "@/components/ui/card";
import { ChartDialog } from "@/components/dialog/ChartDialog";
import { BlockDialog } from "@/components/dialog/BlockDialog";
import { CHART_DIALOG_STEPS } from "@/constants/chart-categories";
import { BLOCK_DIALOG_STEPS } from "@/constants/block-categories";
import { useToast } from "@/hooks/core";
import { ToastContainer } from "@/components/ui/toast";
import {
  ReportsList,
  ReportForm,
  ReportTitleEditor,
  ReportEditor,
  ReportPreview,
} from "@/components/reports";
import {
  useReportTypes,
  useReportGeneration,
  useReportSections,
  useReportTitle,
} from "@/hooks/api";
import { useReportActions, useSectionEditing } from "@/hooks/reports";
import { REPORT_UI_TEXT } from "@/constants/reports";
import { BlockData } from "@/types/reports";
import type { Report } from "@/types/reports";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/query/query-client";
import { MAIN_COLOR } from "@/constants/colors";

export default function Reports() {
  const { toasts, showToast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: reportTypes,
    isLoading: isLoadingReportTypes,
    error: reportTypesError,
    refetch,
  } = useReportTypes();

  const {
    isGenerating,
    selectedReportType,
    selectedReportTypeId,
    generatedReport,
    handleReportTypeChange,
    setGeneratedReport,
    handleGenerateReport,
  } = useReportGeneration();

  const {
    sectionsData,
    sectionStates,
    currentSectionId,
    livePreviewKey,
    setSectionsData,
    setSectionStates,
    setCurrentSectionId,
    loadAllSections,
    fetchSection,
  } = (useReportSections as any)(generatedReport?.id);

  const {
    reportTitle,
    reportSummary,
    isEditingTitle,
    originalTitle,
    originalSummary,
    isSavingTitle,
    isSavingSummary,
    setReportTitle,
    setReportSummary,
    setIsEditingTitle,
    saveTitle,
    saveSummary,
    initializeTitle,
  } = useReportTitle();

  const {
    blockToDelete,
    editingBlock,
    isEditMode,
    isAddingNewSection,
    setBlockToDelete,
    setEditingBlock,
    setIsEditMode,
    toggleSection,
    toggleBlock,
    deleteBlock,
    exportChartJson,
    addSection,
    duplicateBlock,
    editBlock,
  } = useReportActions();

  const {
    editingSection,
    sectionOriginalTitles,
    beforeEditSectionTitles,
    setEditingSection,
    saveSectionTitle,
    cancelSectionEdit,
    startSectionEdit,
  } = useSectionEditing();

  const [showChartDialog, setShowChartDialog] = useState(false);
  const [chartDialogStep, setChartDialogStep] = useState(0);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [blockDialogStep, setBlockDialogStep] = useState(0);
  const [editingChart, setEditingChart] = useState(null);

  const handleGenerateReportWithCallback = useCallback(() => {
    handleGenerateReport((newReport: Report) => {
      setReportTitle(newReport.title);
      setReportSummary(newReport.summary || "");
      initializeTitle(newReport.title, newReport.summary || "");

      if (newReport.sections && newReport.sections.length > 0) {
        setCurrentSectionId(newReport.sections[0].id);
      }
    });
  }, [
    handleGenerateReport,
    setReportTitle,
    setReportSummary,
    initializeTitle,
    setCurrentSectionId,
  ]);

  const handleSaveReportTitle = useCallback(async () => {
    if (generatedReport?.id) {
      await saveTitle(parseInt(generatedReport.id));
    }
  }, [generatedReport?.id, saveTitle]);

  const handleCancelTitleEdit = useCallback(() => {
    setIsEditingTitle(false);
  }, [setReportTitle, setIsEditingTitle]);

  const handleClearTitle = useCallback(() => {
    setReportTitle("");
  }, [setReportTitle]);

  const handleToggleSectionWithCallback = useCallback(
    async (sectionId: number) => {
      await toggleSection(
        sectionId,
        (id: number, isEnabled: boolean) => {
          setSectionStates((prev: any) => ({ ...prev, [id]: isEnabled }));
        },
        (id: number, isEnabled: boolean) => {
          if (generatedReport) {
            const updatedSections = generatedReport.sections.map((s: any) =>
              s.id === id ? { ...s, isEnabled } : s
            );
            setGeneratedReport({
              ...generatedReport,
              sections: updatedSections,
            });
          }
        }
      );
    },
    [toggleSection, setSectionStates, generatedReport, setGeneratedReport]
  );

  const handleToggleBlockWithCallback = useCallback(
    async (blockId: number) => {
      await toggleBlock(
        blockId,
        (id: number, isEnabled: boolean) => {
          setSectionsData((prev: any) => {
            const newData = { ...prev };
            Object.keys(newData).forEach((sectionId) => {
              const section = newData[parseInt(sectionId)];
              if (section?.blocks) {
                const updatedBlocks = section.blocks.map((block: BlockData) =>
                  block.id === id ? { ...block, isEnabled } : block
                );
                newData[parseInt(sectionId)] = {
                  ...section,
                  blocks: updatedBlocks,
                };
              }
              if (section?.charts) {
                const updatedCharts = section.charts.map((chart: any) =>
                  chart.id === id ? { ...chart, isEnabled } : chart
                );
                newData[parseInt(sectionId)] = {
                  ...section,
                  charts: updatedCharts,
                };
              }
            });
            return newData;
          });
        },
        (id: number, isEnabled: boolean) => {
          if (generatedReport) {
            setGeneratedReport((prev: any) => {
              if (!prev) return prev;
              const updatedSections = prev.sections.map((section: any) => {
                const updatedBlocks = section.blocks?.map((block: any) =>
                  block.id === id ? { ...block, isEnabled } : block
                );
                return {
                  ...section,
                  blocks: updatedBlocks || section.blocks,
                };
              });
              return { ...prev, sections: updatedSections };
            });
          }
        }
      );
    },
    [toggleBlock, setSectionsData, generatedReport, setGeneratedReport]
  );

  const handleAddSectionWithCallback = useCallback(async () => {
    if (!generatedReport?.id) return;

    await addSection(parseInt(generatedReport.id), (newSection: any) => {
      setSectionsData((prev: any) => {
        const newData = { ...prev };
        delete newData[newSection.id];
        return newData;
      });

      setGeneratedReport((prev: any) => {
        if (!prev) return null;
        return {
          ...prev,
          sections: [
            ...prev.sections,
            {
              id: newSection.id,
              reportId: newSection.reportId,
              title: newSection.title,
              isEnabled: true,
              orderIndex: newSection.orderIndex,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              blocks: [],
            },
          ],
        };
      });

      setCurrentSectionId(newSection.id);
    });
  }, [
    addSection,
    generatedReport?.id,
    setSectionsData,
    setGeneratedReport,
    setCurrentSectionId,
  ]);

  const handleDuplicateBlockWithCallback = useCallback(
    (block: any) => {
      const result = duplicateBlock(block, sectionsData);
      setCurrentSectionId(result.sectionId);
      setEditingBlock(result.editingBlock);
      setShowBlockDialog(true);
      setBlockDialogStep(0);
    },
    [duplicateBlock, sectionsData, setCurrentSectionId, setEditingBlock]
  );

  const handleEditBlockWithCallback = useCallback(
    (block: BlockData) => {
      const result = editBlock(block);
      setCurrentSectionId(result.sectionId || currentSectionId);
      setEditingBlock(result.editingBlock);
      setShowBlockDialog(true);
      setBlockDialogStep(0);
    },
    [editBlock, currentSectionId, setCurrentSectionId, setEditingBlock]
  );

  const handleSaveSectionTitleWithCallback = useCallback(
    async (sectionId: number) => {
      const section = generatedReport?.sections.find(
        (s: any) => s.id === sectionId
      );
      if (section) {
        await saveSectionTitle(
          sectionId,
          section.title,
          sectionOriginalTitles[sectionId] || "",
          (id: number, title: string) => {
            if (generatedReport) {
              const updatedSections = generatedReport.sections.map((s: any) =>
                s.id === id ? { ...s, title } : s
              );
              setGeneratedReport({
                ...generatedReport,
                sections: updatedSections,
              });
            }
          }
        );
      }
    },
    [
      saveSectionTitle,
      generatedReport,
      sectionOriginalTitles,
      setGeneratedReport,
    ]
  );

  const handleCancelSectionEditWithCallback = useCallback(
    (sectionId: number) => {
      const beforeEditTitle = beforeEditSectionTitles[sectionId];
      cancelSectionEdit(
        sectionId,
        beforeEditTitle,
        (id: number, title: string) => {
          if (generatedReport) {
            const updatedSections = generatedReport.sections.map((s: any) =>
              s.id === id ? { ...s, title } : s
            );
            setGeneratedReport({
              ...generatedReport,
              sections: updatedSections,
            });
          }
        }
      );
    },
    [
      cancelSectionEdit,
      beforeEditSectionTitles,
      generatedReport,
      setGeneratedReport,
    ]
  );

  const handleSectionTitleChange = useCallback(
    (sectionId: number, title: string) => {
      if (generatedReport) {
        const updatedSections = generatedReport.sections.map((s: any) =>
          s.id === sectionId ? { ...s, title } : s
        );
        setGeneratedReport({ ...generatedReport, sections: updatedSections });
      }
    },
    [generatedReport, setGeneratedReport]
  );

  const handleClearSectionTitle = useCallback(
    (sectionId: number) => {
      if (generatedReport) {
        const updatedSections = generatedReport.sections.map((s: any) =>
          s.id === sectionId ? { ...s, title: "" } : s
        );
        setGeneratedReport({ ...generatedReport, sections: updatedSections });
      }
    },
    [generatedReport, setGeneratedReport]
  );

  useEffect(() => {
    if (generatedReport && generatedReport.id && generatedReport.sections) {
      loadAllSections(generatedReport.id, generatedReport.sections as any);
    }
  }, [generatedReport, loadAllSections]);

  useEffect(() => {
    if (generatedReport && currentSectionId && generatedReport.id) {
      fetchSection(generatedReport.id, currentSectionId);
    }
  }, [generatedReport, currentSectionId, fetchSection]);

  const handleCloseChartDialog = useCallback(() => {
    setShowChartDialog(false);
    setChartDialogStep(0);
    setEditingChart(null);
    setIsEditMode(false);
  }, [setIsEditMode]);

  const handleCloseBlockDialog = useCallback(() => {
    setShowBlockDialog(false);
    setBlockDialogStep(0);
    setEditingBlock(null);
    setIsEditMode(false);
  }, [setEditingBlock, setIsEditMode]);

  const handleChartDialogStepChange = useCallback((step: number) => {
    setChartDialogStep(step);
  }, []);

  const handleBlockDialogStepChange = useCallback((step: number) => {
    setBlockDialogStep(step);
  }, []);

  const generateContent = generatedReport ? (
    <div className="h-[calc(100vh-144px)] flex flex-col gap-2">
      <ReportForm
        reportTypes={(reportTypes || []) as any}
        selectedReportType={selectedReportType}
        isLoading={isLoadingReportTypes}
        error={reportTypesError?.message || null}
        isGenerating={isGenerating}
        onReportTypeChange={handleReportTypeChange}
        onGenerate={handleGenerateReportWithCallback}
        onRetry={refetch}
      />

      <div className="flex-1 flex flex-col lg:flex-row gap-2">
        <div className="flex-1 min-h-[60vh]">
          <Card className="h-full">
            <CardContent className="h-full flex flex-col !p-0">
              {isGenerating ? (
                <>
                  <div className="h-1 bg-[#707FDD] animate-pulse mb-4"></div>
                  <div className="flex-1 flex items-center justify-center min-h-[400px]">
                    <div className="text-center space-y-4">
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-gray-800">
                          Generating {selectedReportType}...
                        </h3>
                        <p className="text-sm text-gray-600">
                          {REPORT_UI_TEXT.MESSAGES.GENERATING_REPORT}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 overflow-y-auto space-y-6 max-h-[70vh] hide-scrollbar">
                  <div className="px-[24px] mt-[24px] mb-0">
                    <ReportTitleEditor
                      reportTitle={reportTitle}
                      isEditing={isEditingTitle}
                      isSaving={isSavingTitle}
                      onTitleChange={setReportTitle}
                      onStartEdit={() => setIsEditingTitle(true)}
                      onSave={handleSaveReportTitle}
                      onCancel={handleCancelTitleEdit}
                      onClear={handleClearTitle}
                    />
                  </div>

                  <ReportEditor
                    sections={generatedReport.sections as any}
                    sectionsData={sectionsData}
                    sectionStates={sectionStates}
                    editingSection={editingSection}
                    isAddingNewSection={isAddingNewSection}
                    onSectionTitleChange={handleSectionTitleChange}
                    onStartSectionEdit={(sectionId) =>
                      startSectionEdit(
                        sectionId,
                        generatedReport.sections.find(
                          (s: any) => s.id === sectionId
                        )?.title || ""
                      )
                    }
                    onSaveSectionTitle={handleSaveSectionTitleWithCallback}
                    onCancelSectionEdit={handleCancelSectionEditWithCallback}
                    onClearSectionTitle={handleClearSectionTitle}
                    onToggleSection={handleToggleSectionWithCallback}
                    onAddBlock={(sectionId) => {
                      setCurrentSectionId(sectionId);
                      setEditingBlock(null);
                      setIsEditMode(false);
                      setShowBlockDialog(true);
                      setBlockDialogStep(0);
                    }}
                    onAddSection={handleAddSectionWithCallback}
                    onToggleBlock={handleToggleBlockWithCallback}
                    onEditBlock={handleEditBlockWithCallback}
                    onDuplicateBlock={handleDuplicateBlockWithCallback}
                    onDeleteBlock={(blockId) => setBlockToDelete(blockId)}
                    onExportChartJson={exportChartJson}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex-1 min-h-[69vh]">
          <ReportPreview
            generatedReport={generatedReport as any}
            sectionsData={sectionsData}
            livePreviewKey={livePreviewKey}
          />
        </div>
      </div>

      <ChartDialog
        isOpen={showChartDialog}
        onClose={handleCloseChartDialog}
        title={isEditMode ? "EDIT CHART" : "ADD NEW CHART / GRAPH"}
        steps={CHART_DIALOG_STEPS}
        currentStep={chartDialogStep}
        onStepChange={handleChartDialogStepChange}
        reportId={parseInt(generatedReport?.id || "0")}
        sectionId={currentSectionId || undefined}
        reportTypeId={
          selectedReportTypeId || (generatedReport as any)?.reportTypeId
        }
        editingChart={editingChart || undefined}
        isEditMode={isEditMode}
        onChartGenerated={async () => {
          if (generatedReport && currentSectionId && generatedReport.id) {
            await queryClient.invalidateQueries({
              queryKey: QUERY_KEYS.SECTIONS.DETAIL(
                generatedReport.id.toString(),
                currentSectionId.toString()
              ),
            });
            await fetchSection(generatedReport.id, currentSectionId);
          }
        }}
      />

      <BlockDialog
        isOpen={showBlockDialog}
        onClose={handleCloseBlockDialog}
        title="ADD NEW BLOCK"
        steps={BLOCK_DIALOG_STEPS}
        currentStep={blockDialogStep}
        onStepChange={handleBlockDialogStepChange}
        reportId={parseInt(generatedReport?.id || "0")}
        sectionId={currentSectionId || undefined}
        sectionName={
          currentSectionId
            ? sectionsData[currentSectionId]?.title || "section"
            : "section"
        }
        reportTypeId={
          selectedReportTypeId || (generatedReport as any)?.reportTypeId
        }
        existingBlocks={
          currentSectionId ? sectionsData[currentSectionId]?.blocks || [] : []
        }
        editingBlock={(editingBlock as any) || undefined}
        isEditMode={isEditMode}
        onBlockGenerated={async () => {
          if (generatedReport && currentSectionId && generatedReport.id) {
            await queryClient.invalidateQueries({
              queryKey: QUERY_KEYS.SECTIONS.DETAIL(
                generatedReport.id.toString(),
                currentSectionId.toString()
              ),
            });
            await fetchSection(generatedReport.id, currentSectionId);
          }
          setEditingBlock(null);
        }}
      />
    </div>
  ) : (
    <div className="h-full flex flex-col gap-4">
      <div className="w-full">
        <ReportForm
          reportTypes={(reportTypes || []) as any}
          selectedReportType={selectedReportType}
          isLoading={isLoadingReportTypes}
          error={reportTypesError?.message || null}
          isGenerating={isGenerating}
          onReportTypeChange={handleReportTypeChange}
          onGenerate={handleGenerateReportWithCallback}
          onRetry={refetch}
        />
      </div>

      <div className="flex-1 pb-6 rounded-lg">
        <Card className="h-full min-h-[69vh] p-0 rounded-none">
          {isGenerating ? (
            <>
              <div className="h-1 bg-[#707FDD] animate-pulse"></div>
              <div className="h-full w-full flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">
                      Generating {selectedReportType}...
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {REPORT_UI_TEXT.MESSAGES.GENERATING_REPORT}
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full w-full flex items-center justify-center min-h-[50vh]">
              <div className="text-center space-y-6 px-8">
                <div className="space-y-4">
                  <h3 className="text-2xl font-semibold text-foreground">
                    {REPORT_UI_TEXT.MESSAGES.GENERATE_TEMPLATE}
                  </h3>
                  <p className="text-base text-muted-foreground max-w-md mx-auto">
                    {REPORT_UI_TEXT.MESSAGES.SELECT_AND_GENERATE}
                  </p>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );

  const listContent = (
    <div className="h-full flex flex-col">
      <ReportsList />
    </div>
  );

  const tabs = createReportTabs(generateContent, listContent);

  return (
    <>
      {isGenerating && (
        <div
          className="h-1 animate-pulse fixed top-0 left-0 right-0 z-50"
          style={{ backgroundColor: MAIN_COLOR }}
        />
      )}
      <div className="h-full flex flex-col">
        <CustomTabs tabs={tabs} defaultTab="generate" onTabChange={() => {}} />
      </div>
      <ToastContainer toasts={toasts} />
    </>
  );
}
