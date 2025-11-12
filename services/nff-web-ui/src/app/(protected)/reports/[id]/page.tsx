"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";
import { BlockDialog } from "@/components/dialog/BlockDialog";
import { ChartDialog } from "@/components/dialog/ChartDialog";
import { BLOCK_DIALOG_STEPS } from "@/constants/block-categories";
import { CHART_DIALOG_STEPS } from "@/constants/chart-categories";
import { ReportDetailLayout } from "@/components/reports/detail/ReportDetailLayout";
import { Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/core";
import {
  useReportSections,
  useReportTitle,
  useReport,
  useDeleteReport,
} from "@/hooks/api";
import { useReportActions, useSectionEditing } from "@/hooks/reports";
import { useExportPdf, useExportHtml } from "@/hooks/reports/useExports";
import { GeneratedReport, ReportSection } from "@/types/reports";
import { ChartDataStructure } from "@/types";
import { REPORT_UI_TEXT } from "@/constants/reports";

interface ReportDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mode?: "preview" | "edit" }>;
}

export default function ReportDetailPage({
  params,
  searchParams,
}: ReportDetailPageProps) {
  const router = useRouter();
  const resolvedParams = use(params) as { id: string };
  const resolvedSearchParams = use(searchParams) as {
    mode?: "preview" | "edit";
  };
  const { id } = resolvedParams;
  const mode = resolvedSearchParams.mode || "edit";
  const isPreviewMode = mode === "preview";

  const { showToast } = useToast();
  const numericReportId = parseInt(id);

  const {
    data: reportData,
    isLoading,
    error: reportError,
  } = useReport(numericReportId);

  const deleteReportMutation = useDeleteReport();
  const exportPdfMutation = useExportPdf();
  const exportHtmlMutation = useExportHtml();

  const [generatedReport, setGeneratedReport] =
    useState<GeneratedReport | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showHtmlExportDialog, setShowHtmlExportDialog] = useState(false);

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
  } = useReportSections(numericReportId);

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
  const [editingChart, setEditingChart] = useState<ChartDataStructure | null>(
    null
  );

  useEffect(() => {
    if (reportData) {
      const sections = reportData.sections || [];
      const transformedSections: ReportSection[] = sections.map(
        (section: any) => ({
          id: section.id,
          reportId: section.reportId || numericReportId,
          title: section.title,
          isEnabled: section.isEnabled,
          orderIndex: section.orderIndex,
          createdAt: section.createdAt,
          updatedAt: section.updatedAt,
          blocks: section.blocks || []
        })
      );

      const newReport: GeneratedReport = {
        id: reportData.id.toString(),
        type: reportData.title,
        reportTypeId: (reportData as any).reportTypeId || 1,
        sections: transformedSections,
      };

      setGeneratedReport(newReport);
      initializeTitle(reportData.title, reportData.summary || "");

      if (transformedSections.length > 0) {
        setCurrentSectionId(transformedSections[0].id);
      }
    }
  }, [reportData, initializeTitle, setCurrentSectionId, numericReportId]);

  useEffect(() => {
    if (generatedReport && generatedReport.id && generatedReport.sections) {
      loadAllSections(parseInt(generatedReport.id), generatedReport.sections);
    }
  }, [generatedReport, loadAllSections]);

  useEffect(() => {
    if (generatedReport && currentSectionId && generatedReport.id) {
      fetchSection(parseInt(generatedReport.id), currentSectionId);
    }
  }, [generatedReport, currentSectionId, fetchSection]);

  const handleSaveTitle = useCallback(async () => {
    if (generatedReport?.id) {
      await saveTitle(parseInt(generatedReport.id));
      setGeneratedReport((prev) =>
        prev ? { ...prev, type: reportTitle } : null
      );
    }
  }, [generatedReport?.id, reportTitle, saveTitle]);

  const handleSaveSummary = useCallback(async () => {
    if (generatedReport?.id) {
      await saveSummary(parseInt(generatedReport.id));
    }
  }, [generatedReport?.id, saveSummary]);

  const handleCancelTitleEdit = useCallback(() => {
    setReportTitle(originalTitle);
    setIsEditingTitle(false);
  }, [setReportTitle, originalTitle, setIsEditingTitle]);

  const handleClearTitle = useCallback(() => {
    setReportTitle("");
  }, [setReportTitle]);

  const handleToggleSectionWithCallback = useCallback(
    async (sectionId: number) => {
      if (isPreviewMode) return;

      await toggleSection(
        sectionId,
        (id: number, isEnabled: boolean) => {
          setSectionStates((prev) => ({ ...prev, [id]: isEnabled }));
        },
        (id: number, isEnabled: boolean) => {
          if (generatedReport) {
            const updatedSections = generatedReport.sections.map(
              (s: ReportSection) => (s.id === id ? { ...s, isEnabled } : s)
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
      isPreviewMode,
      toggleSection,
      setSectionStates,
      generatedReport,
      setGeneratedReport,
    ]
  );

  const handleToggleBlockWithCallback = useCallback(
    async (blockId: number) => {
      if (isPreviewMode) return;

      await toggleBlock(
        blockId,
        (id: number, isEnabled: boolean) => {
          setSectionsData((prev) => {
            const newData = { ...prev };
            Object.keys(newData).forEach((sectionId) => {
              const section = newData[parseInt(sectionId)];
              if (section?.blocks) {
                const updatedBlocks = section.blocks.map((block: any) =>
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
            setGeneratedReport((prev) => {
              if (!prev) return prev;
              const updatedSections = prev.sections.map(
                (section: ReportSection) => {
                  const updatedBlocks = section.blocks?.map((block: any) =>
                    block.id === id ? { ...block, isEnabled } : block
                  );
                  return {
                    ...section,
                    blocks: updatedBlocks || section.blocks,
                  };
                }
              );
              return { ...prev, sections: updatedSections };
            });
          }
        }
      );
    },
    [
      isPreviewMode,
      toggleBlock,
      setSectionsData,
      generatedReport,
      setGeneratedReport,
    ]
  );

  const handleDeleteBlockWithCallback = useCallback(
    async (blockId: number) => {
      if (isPreviewMode) return;

      await deleteBlock(blockId, (id: number) => {
        setSectionsData((prev) => {
          const newData = { ...prev };
          Object.keys(newData).forEach((sectionId) => {
            const section = newData[parseInt(sectionId)];
            if (section?.blocks) {
              const updatedBlocks = section.blocks.filter(
                (block: any) => block.id !== id
              );
              newData[parseInt(sectionId)] = {
                ...section,
                blocks: updatedBlocks,
              };
            }
          });
          return newData;
        });
      });
    },
    [isPreviewMode, deleteBlock, setSectionsData]
  );

  const handleAddSectionWithCallback = useCallback(async () => {
    if (isPreviewMode || !generatedReport?.id) return;

    await addSection(parseInt(generatedReport.id), (newSection: any) => {
      setGeneratedReport((prev) => {
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
    isPreviewMode,
    addSection,
    generatedReport?.id,
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
    (block: any) => {
      if (isPreviewMode) return;

      const result = editBlock(block);
      setCurrentSectionId(result.sectionId || currentSectionId);
      setEditingBlock(result.editingBlock);
      setShowBlockDialog(true);
      setBlockDialogStep(0);
    },
    [
      isPreviewMode,
      editBlock,
      currentSectionId,
      setCurrentSectionId,
      setEditingBlock,
    ]
  );

  const handleSaveSectionTitleWithCallback = useCallback(
    async (sectionId: number) => {
      const section = generatedReport?.sections.find((s) => s.id === sectionId);
      if (section) {
        await saveSectionTitle(
          sectionId,
          section.title,
          sectionOriginalTitles[sectionId] || "",
          (id: number, title: string) => {
            if (generatedReport) {
              const updatedSections = generatedReport.sections.map((s) =>
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
            const updatedSections = generatedReport.sections.map((s) =>
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
        const updatedSections = generatedReport.sections.map((s) =>
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
        const updatedSections = generatedReport.sections.map((s) =>
          s.id === sectionId ? { ...s, title: "" } : s
        );
        setGeneratedReport({ ...generatedReport, sections: updatedSections });
      }
    },
    [generatedReport, setGeneratedReport]
  );

  const handleDeleteReport = useCallback(async () => {
    if (!numericReportId) return;

    try {
      await deleteReportMutation.mutateAsync(numericReportId);

      showToast({
        type: "success",
        title: "Success",
        description: REPORT_UI_TEXT.SUCCESS.REPORT_DELETED,
      });
      router.push("/reports");
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting report:", error);
      showToast({
        type: "error",
        title: "Error",
        description: REPORT_UI_TEXT.ERRORS.FAILED_DELETE_REPORT,
      });
    }
  }, [numericReportId, deleteReportMutation, showToast, router]);

  const handleConvertToHtml = useCallback(() => {
    setShowHtmlExportDialog(true);
  }, []);

  const handleExportReport = useCallback(async () => {
    if (!id) return;

    try {
      const result = await exportPdfMutation.mutateAsync({
        reportId: parseInt(id),
        config: {
          includeCharts: true,
          includeImages: true,
        },
      });

      if (result.success && result.data?.downloadUrl) {
        window.open(result.data.downloadUrl, "_blank");
        showToast({
          type: "success",
          title: "Success",
          description: REPORT_UI_TEXT.SUCCESS.PDF_EXPORT_COMPLETED,
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error",
        description: REPORT_UI_TEXT.ERRORS.FAILED_EXPORT_PDF,
      });
    }
  }, [id, exportPdfMutation, showToast]);

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

  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-105px)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-800">
              Loading report...
            </h3>
            <p className="text-sm text-gray-600">
              Please wait while we load the report data
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (reportError) {
    return (
      <div className="h-[calc(100vh-105px)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="h-8 w-8 mx-auto text-red-600" />
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-800">
              Error loading report
            </h3>
            <p className="text-sm text-gray-600">
              {reportError.message || "Failed to load report data"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!reportData || !generatedReport) {
    return (
      <div className="h-[calc(100vh-56px)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 mx-auto text-red-500" />
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-800">
              Report not found
            </h3>
            <p className="text-sm text-gray-600">
              {REPORT_UI_TEXT.MESSAGES.REPORT_NOT_FOUND}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const reportInfo =
    isPreviewMode && reportData
      ? `${reportData.id} - ${reportTitle} - ${formatDate(
          new Date(reportData.createdAt)
        )}`
      : undefined;

  return (
    <>
      <ReportDetailLayout
        generatedReport={generatedReport}
        sectionsData={sectionsData}
        sectionStates={sectionStates}
        livePreviewKey={livePreviewKey}
        reportTitle={reportTitle}
        reportSummary={reportSummary}
        isEditingTitle={isEditingTitle}
        isSavingTitle={isSavingTitle}
        isSavingSummary={isSavingSummary}
        editingSection={editingSection}
        isAddingNewSection={isAddingNewSection}
        blockToDelete={blockToDelete}
        showDeleteDialog={showDeleteDialog}
        showHtmlExportDialog={showHtmlExportDialog}
        isExporting={
          exportPdfMutation.isPending || exportHtmlMutation.isPending
        }
        isDeleting={deleteReportMutation.isPending}
        onTitleChange={setReportTitle}
        onStartEdit={() => setIsEditingTitle(true)}
        onSaveTitle={handleSaveTitle}
        onCancelTitleEdit={handleCancelTitleEdit}
        onClearTitle={handleClearTitle}
        onSummaryChange={setReportSummary}
        onSaveSummary={handleSaveSummary}
        onSectionTitleChange={handleSectionTitleChange}
        onStartSectionEdit={(sectionId) =>
          startSectionEdit(
            sectionId,
            generatedReport.sections.find((s) => s.id === sectionId)?.title ||
              ""
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
        onDeleteBlock={handleDeleteBlockWithCallback}
        onExportChartJson={exportChartJson}
        onDeleteReport={handleDeleteReport}
        onConvertToHtml={handleConvertToHtml}
        onExportReport={handleExportReport}
        onSetBlockToDelete={setBlockToDelete}
        onSetShowDeleteDialog={setShowDeleteDialog}
        onSetShowHtmlExportDialog={setShowHtmlExportDialog}
        isPreviewMode={isPreviewMode}
        reportInfo={reportInfo}
        reportId={id}
      />

      <BlockDialog
        isOpen={showBlockDialog}
        onClose={handleCloseBlockDialog}
        title="ADD NEW BLOCK"
        steps={BLOCK_DIALOG_STEPS}
        currentStep={blockDialogStep}
        onStepChange={handleBlockDialogStepChange}
        reportId={
          generatedReport?.id ? parseInt(generatedReport.id) : undefined
        }
        sectionId={currentSectionId || undefined}
        sectionName={
          currentSectionId
            ? sectionsData[currentSectionId]?.title || "section"
            : "section"
        }
        reportTypeId={generatedReport?.reportTypeId}
        existingBlocks={
          currentSectionId ? sectionsData[currentSectionId]?.blocks || [] : []
        }
        editingBlock={(editingBlock as any) || undefined}
        isEditMode={isEditMode}
        onBlockGenerated={async () => {
          if (currentSectionId) {
            if (generatedReport && generatedReport.id) {
              const reportId = parseInt(generatedReport.id);
              fetchSection(reportId, currentSectionId);
            }
          }
          setEditingBlock(null);
        }}
      />

      <ChartDialog
        isOpen={showChartDialog}
        onClose={handleCloseChartDialog}
        title={isEditMode ? "EDIT CHART" : "ADD NEW CHART / GRAPH"}
        steps={CHART_DIALOG_STEPS}
        currentStep={chartDialogStep}
        onStepChange={handleChartDialogStepChange}
        reportId={
          generatedReport?.id ? parseInt(generatedReport.id) : undefined
        }
        sectionId={currentSectionId || undefined}
        reportTypeId={generatedReport?.reportTypeId}
        editingChart={editingChart || undefined}
        isEditMode={isEditMode}
        onChartGenerated={async () => {
          if (generatedReport && currentSectionId && generatedReport.id) {
            const reportId = parseInt(generatedReport.id);
            await fetchSection(reportId, currentSectionId);
          }
        }}
      />
    </>
  );
}
