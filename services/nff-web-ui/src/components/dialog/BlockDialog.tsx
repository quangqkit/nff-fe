"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToastContainer } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CHART_DIALOG_STEPS } from "@/constants/chart-categories";
import { DEFAULT_CHART_CUSTOMIZATION } from "@/constants/chart-config";
import { useToast } from "@/hooks/core";
import { BlockResponse, CreateBlockDto } from "@/lib/api/block";
import { useCreateBlock, useUpdateBlock } from "@/hooks/reports/useBlocks";
import {
  ChartCustomization,
  ChartPosition,
  SelectedIndicator,
  ReportBlock,
  ChartDataTransfer,
} from "@/types";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { ChartDialog } from "./ChartDialog";
import { BulletsBlockConfig } from "./blocks/BulletsBlockConfig";
import { ChartBlockConfig } from "./blocks/ChartBlockConfig";
import { NotesBlockConfig } from "./blocks/NotesBlockConfig";
import { TableBlockConfig } from "./blocks/TableBlockConfig";
import { TextBlockConfig } from "./blocks/TextBlockConfig";

interface BlockDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  steps?: Array<{
    id: string;
    title: string;
    description: string;
    icon: React.ReactElement;
  }>;
  currentStep?: number;
  onStepChange?: (step: number) => void;
  reportId?: number;
  sectionId?: number;
  sectionName?: string;
  reportTypeId?: number;
  editingBlock?: ReportBlock;
  isEditMode?: boolean;
  existingBlocks?: Array<{ orderIndex: number }>;
  onBlockGenerated?: (block: BlockResponse) => void;
}

export function BlockDialog({
  isOpen,
  onClose,
  reportId,
  sectionId,
  sectionName,
  reportTypeId,
  editingBlock,
  isEditMode = false,
  existingBlocks = [],
  onBlockGenerated,
}: BlockDialogProps) {
  const { toasts, showToast } = useToast();
  const createBlockMutation = useCreateBlock();
  const updateBlockMutation = useUpdateBlock();
  const [selectedBlockType, setSelectedBlockType] = useState<string>("text");
  const [blockName, setBlockName] = useState<string>("");
  const [order, setOrder] = useState<number>(0);
  const [columns, setColumns] = useState<number>(12);
  const [supportPrompt, setSupportPrompt] = useState<string>("");
  const [paragraphContent, setParagraphContent] = useState<string>("");
  const [chartTitle, setChartTitle] = useState<string>("");
  const [showChartDialog, setShowChartDialog] = useState<boolean>(false);
  const [chartCurrentStep, setChartCurrentStep] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [generatedChartData, setGeneratedChartData] = useState<
    ChartDataTransfer | undefined
  >(undefined);
  const [bulletsContent, setBulletsContent] = useState<string>("");
  const [isEditingChartFromPreview, setIsEditingChartFromPreview] =
    useState(false);

  useEffect(() => {
    if (!isOpen && showChartDialog) {
      setShowChartDialog(false);
      setIsEditingChartFromPreview(false);
    }
  }, [isOpen, showChartDialog]);

  useEffect(() => {
    if (isOpen && !isEditMode) {
      setBulletsContent("");
    }
  }, [isOpen, isEditMode]);

  useEffect(() => {
    if (!isOpen) return;

    if (editingBlock) {
      setBlockName(editingBlock.name || "");
      setOrder(editingBlock.orderIndex || 0);
      setColumns(editingBlock.columns || 12);

      const blockType = editingBlock.type.toLowerCase();
      setSelectedBlockType(blockType);

      if (editingBlock.content) {
        if (editingBlock.type === "text" || editingBlock.type === "TEXT") {
          const content = editingBlock.content;
          let textContent = "";

          if (typeof content === "string") {
            textContent = content;
          } else if (typeof content === "object" && content !== null) {
            const contentObj = content as Record<string, unknown>;
            textContent =
              (contentObj.plainText as string) ||
              (contentObj.richText as string) ||
              "";
          }

          setParagraphContent(textContent || "");
        }
        if (
          (editingBlock.type === "chart" || editingBlock.type === "CHART") &&
          editingBlock.content
        ) {
          const content = editingBlock.content as any;
          const title =
            content.chartTitle ||
            content.chartConfig?.title ||
            editingBlock.name ||
            "";
          setChartTitle(title);

          let selectedIndicators: SelectedIndicator[] = [];

          if (
            Array.isArray(content.selectedIndicators) &&
            content.selectedIndicators.length > 0
          ) {
            selectedIndicators =
              content.selectedIndicators as SelectedIndicator[];
          } else if (
            Array.isArray(content.indicatorConfigs) &&
            content.indicatorConfigs.length > 0
          ) {
            selectedIndicators = content.indicatorConfigs.map(
              (config: any) => ({
                indicatorId:
                  config.indicatorId?.toString() || config.id?.toString() || "",
                chartType: config.chartType || "line",
                dateRange: {
                  preset: "CUSTOM" as const,
                  customStart: config.dateRangeStart
                    ? new Date(config.dateRangeStart)
                    : new Date("2000-01-01"),
                  customEnd: config.dateRangeEnd
                    ? new Date(config.dateRangeEnd)
                    : new Date(),
                },
                isSelected: true,
              })
            ) as SelectedIndicator[];
          }

          const chartData: ChartDataTransfer = {
            id: editingBlock.id,
            title: title,
            chartConfig: {
              ...(content.chartConfig || {}),
              title: title,
            },
            chartCustomization:
              (content.chartCustomization as ChartCustomization) ||
              DEFAULT_CHART_CUSTOMIZATION,
            chartPosition: (content.chartPosition as ChartPosition) || "top",
            categoryId: (content.categoryId as number) || 0,
            categoryName: (content.categoryName as string) || "",
            selectedIndicators: selectedIndicators,
            orderIndex: editingBlock.orderIndex,
            generatedAt: new Date(),
            status: "generated" as const,
          };
          setGeneratedChartData(chartData);
        }

        if (
          editingBlock.type === "bullets" &&
          (editingBlock.content as any).bullets
        ) {
          if (Array.isArray((editingBlock.content as any).bullets)) {
            const bulletsHtml = (editingBlock.content as any).bullets
              .map((bullet: any) => {
                const text =
                  typeof bullet === "string" ? bullet : bullet.text || "";
                return `<li>${text}</li>`;
              })
              .join("");
            setBulletsContent(bulletsHtml ? `<ul>${bulletsHtml}</ul>` : "");
          } else if (
            typeof (editingBlock.content as any).bullets === "string"
          ) {
            setBulletsContent((editingBlock.content as any).bullets);
          }
        }
      }
    } else {
      setSelectedBlockType("text");
      setBlockName("");
      setOrder(0);
      setColumns(12);
      setSupportPrompt("");
      setParagraphContent("");
      setChartTitle("");
      setGeneratedChartData(undefined);
      setShowChartDialog(false);
    }
  }, [isOpen, isEditMode, editingBlock]);

  const handleClose = () => {
    if (showChartDialog) {
      setShowChartDialog(false);
      return;
    }

    setSelectedBlockType("text");
    setBlockName("");
    setOrder(0);
    setColumns(12);
    setSupportPrompt("");
    setParagraphContent("");
    setChartTitle("");
    setGeneratedChartData(undefined);
    setIsLoading(false);
    onClose();
  };

  const handleBlockTypeSelect = (blockType: string) => {
    setSelectedBlockType(blockType);
  };

  const handleAddChart = () => {
    setShowChartDialog(true);
  };

  const handleEditChart = () => {
    setIsEditingChartFromPreview(true);
    setChartCurrentStep(0);
    setShowChartDialog(true);
  };

  const handleCloseChartDialog = () => {
    setShowChartDialog(false);
    setChartCurrentStep(0);
    setIsEditingChartFromPreview(false);
  };

  const handleAcceptAndInsert = async () => {
    try {
      setIsLoading(true);
      if (selectedBlockType === "text" && !paragraphContent.trim()) {
        showToast({
          title: "Error",
          description: "Please enter paragraph content for text block",
          type: "error",
        });
        setIsLoading(false);
        return;
      }

      if (selectedBlockType === "chart" && !generatedChartData) {
        setIsLoading(false);
        return;
      }

      if (columns < 1 || columns > 12) {
        setIsLoading(false);
        return;
      }

      const existingOrders = existingBlocks.map((block) => block.orderIndex);

      if (isEditMode && editingBlock) {
        const currentBlockOrder = editingBlock.orderIndex;
        const otherOrders = existingOrders.filter(
          (order) => order !== currentBlockOrder
        );
        if (otherOrders.includes(order)) {
          showToast({
            title: "Warning",
            description: `Order ${order} already exists. Please choose a different order.`,
            type: "warning",
          });
          setIsLoading(false);
          return;
        }
      } else if (!isEditMode && existingOrders.includes(order)) {
        showToast({
          title: "Warning",
          description: `Order ${order} already exists. Please choose a different order.`,
          type: "warning",
        });
        setIsLoading(false);
        return;
      }

      const finalBlockName =
        blockName.trim() ||
        `${
          selectedBlockType.charAt(0).toUpperCase() + selectedBlockType.slice(1)
        } Block`;

      const blockData = isEditMode
        ? {
            name: finalBlockName,
            orderIndex: order,
            columns: columns,
            content:
              selectedBlockType === "text"
                ? {
                    plainText: paragraphContent,
                    richText: paragraphContent, // Use same content for both
                  }
                : selectedBlockType === "chart" && generatedChartData
                ? {
                    chartTitle: chartTitle.trim() || generatedChartData.title || "",
                    chartConfig: {
                      ...generatedChartData.chartConfig,
                      title: chartTitle.trim() || generatedChartData.title || "",
                    },
                    chartCustomization:
                      generatedChartData.chartCustomization as unknown as Record<
                        string,
                        unknown
                      >,
                    chartPosition: generatedChartData.chartPosition,
                    categoryId: generatedChartData.categoryId,
                    categoryName: generatedChartData.categoryName,
                    selectedIndicators:
                      generatedChartData.selectedIndicators as unknown as Array<
                        Record<string, unknown>
                      >,
                  }
                : selectedBlockType === "chart"
                ? { chartTitle: chartTitle }
                : selectedBlockType === "bullets"
                ? {
                    title: finalBlockName,
                    bullets: bulletsContent,
                  }
                : selectedBlockType === "notes"
                ? {
                    title: finalBlockName,
                    noteText: supportPrompt || "Sample note content",
                    noteType: "info",
                    backgroundColor: "#fef3c7",
                    borderColor: "#f59e0b",
                  }
                : {},
          }
        : {
            name: finalBlockName,
            type: selectedBlockType.toUpperCase() as
              | "TEXT"
              | "CHART"
              | "TABLE"
              | "BULLETS"
              | "NOTES",
            orderIndex: order,
            columns: columns,
            isEnabled: true,
            content:
              selectedBlockType === "text"
                ? {
                    plainText: paragraphContent,
                    richText: paragraphContent,
                  }
                : selectedBlockType === "chart" && generatedChartData
                ? {
                    chartTitle: chartTitle.trim() || generatedChartData.title || "",
                    chartConfig: {
                      ...generatedChartData.chartConfig,
                      title: chartTitle.trim() || generatedChartData.title || "",
                    },
                    chartCustomization:
                      generatedChartData.chartCustomization as unknown as Record<
                        string,
                        unknown
                      >,
                    chartPosition: generatedChartData.chartPosition,
                    categoryId: generatedChartData.categoryId,
                    categoryName: generatedChartData.categoryName,
                    selectedIndicators:
                      generatedChartData.selectedIndicators as unknown as Array<
                        Record<string, unknown>
                      >,
                  }
                : selectedBlockType === "chart"
                ? { chartTitle: chartTitle }
                : selectedBlockType === "bullets"
                ? {
                    title: finalBlockName,
                    bullets: bulletsContent,
                  }
                : selectedBlockType === "notes"
                ? {
                    title: finalBlockName,
                    noteText: supportPrompt || "Sample note content",
                    noteType: "info",
                    backgroundColor: "#fef3c7",
                    borderColor: "#f59e0b",
                  }
                : {},
          };

      if (sectionId) {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        try {
          let resultBlock;
          if (isEditMode && editingBlock) {
            resultBlock = await updateBlockMutation.mutateAsync({
              blockId: editingBlock.id,
              data: blockData as CreateBlockDto,
            });
          } else {
            resultBlock = await createBlockMutation.mutateAsync({
              sectionId,
              data: blockData as CreateBlockDto,
            });
          }
          onBlockGenerated?.(resultBlock);
          handleClose();
        } catch (apiError) {
          console.error("API Error details:", apiError);
          throw apiError;
        }
      } else {
        setIsLoading(false);
      }
    } catch (error: unknown) {
      console.error("Error creating block:", error);
      setIsLoading(false);
    }
  };

  const blockTypes = [
    { id: "text", name: "Text" },
    { id: "chart", name: "Chart" },
    // { id: "table", name: "Table" }, // Commented out as requested
    { id: "bullets", name: "Bullets" },
    { id: "notes", name: "Notes" },
  ];

  return (
    <>
      <TooltipProvider>
        <Dialog open={isOpen} onOpenChange={handleClose}>
          <DialogContent
            className="max-w-4xl max-h-[95vh] overflow-y-auto p-0"
            onInteractOutside={(e) => e.preventDefault()}
          >
            <div className="p-6 py-4">
              <DialogHeader className="flex flex-row items-center justify-between">
                <DialogTitle>
                  {isEditMode
                    ? `Edit section '${sectionName || "section"}'`
                    : `New block for '${sectionName || "section"}'`}
                </DialogTitle>
              </DialogHeader>
            </div>

            <div className="px-6 py-4 pt-0">
              <div className="space-y-6">
                <Tabs
                  value={selectedBlockType}
                  onValueChange={handleBlockTypeSelect}
                >
                  <TabsList className="grid w-full grid-cols-4">
                    {blockTypes.map((blockType) => (
                      <TabsTrigger
                        key={blockType.id}
                        value={blockType.id}
                        className="cursor-pointer transition-all duration-300 ease-in-out data-[state=active]:bg-[#707FDD] data-[state=active]:text-[#FFFFFF] data-[state=active]:shadow-sm hover:bg-[#707FDD]/10"
                      >
                        {blockType.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {/* Tab Content for each block type */}
                  <TabsContent
                    value="text"
                    className="mt-6 animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
                  >
                    <TextBlockConfig
                      blockName={blockName}
                      setBlockName={setBlockName}
                      order={order}
                      setOrder={setOrder}
                      columns={columns}
                      setColumns={setColumns}
                      paragraphContent={paragraphContent}
                      setParagraphContent={setParagraphContent}
                    />
                  </TabsContent>

                  <TabsContent
                    value="chart"
                    className="mt-6 animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
                  >
                    <ChartBlockConfig
                      blockName={blockName}
                      setBlockName={setBlockName}
                      order={order}
                      setOrder={setOrder}
                      columns={columns}
                      setColumns={setColumns}
                      supportPrompt={supportPrompt}
                      setSupportPrompt={setSupportPrompt}
                      chartTitle={chartTitle}
                      setChartTitle={setChartTitle}
                      onAddChart={handleAddChart}
                      onEditChart={handleEditChart}
                      generatedChartData={generatedChartData}
                      isEditMode={isEditMode}
                    />
                  </TabsContent>

                  {/* <TabsContent value="table" className="mt-6">
                    <TableBlockConfig
                      blockName={blockName}
                      setBlockName={setBlockName}
                      order={order}
                      setOrder={setOrder}
                      columns={columns}
                      setColumns={setColumns}
                    />
                  </TabsContent> */}

                  <TabsContent
                    value="bullets"
                    className="mt-6 animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
                  >
                    <BulletsBlockConfig
                      blockName={blockName}
                      setBlockName={setBlockName}
                      order={order}
                      setOrder={setOrder}
                      columns={columns}
                      setColumns={setColumns}
                      bulletsContent={bulletsContent}
                      setBulletsContent={setBulletsContent}
                    />
                  </TabsContent>

                  <TabsContent
                    value="notes"
                    className="mt-6 animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
                  >
                    <NotesBlockConfig
                      blockName={blockName}
                      setBlockName={setBlockName}
                      order={order}
                      setOrder={setOrder}
                      columns={columns}
                      setColumns={setColumns}
                      paragraphContent={supportPrompt}
                      setParagraphContent={setSupportPrompt}
                    />
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    disabled={isLoading}
                    className="cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAcceptAndInsert}
                    disabled={
                      isLoading ||
                      !blockName.trim() ||
                      (selectedBlockType === "chart" && !chartTitle.trim()) ||
                      (selectedBlockType === "chart" && !generatedChartData)
                    }
                    className="cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        {isEditMode ? "Updating..." : "Creating..."}
                      </>
                    ) : isEditMode ? (
                      "Update & save"
                    ) : (
                      "Accept & insert"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </TooltipProvider>

      <ChartDialog
        isOpen={showChartDialog}
        onClose={handleCloseChartDialog}
        title={
          (isEditMode && editingBlock?.type === "chart") ||
          isEditingChartFromPreview
            ? "Edit Chart"
            : "ADD NEW CHART / GRAPH"
        }
        steps={CHART_DIALOG_STEPS}
        currentStep={chartCurrentStep}
        onStepChange={setChartCurrentStep}
        reportId={reportId}
        sectionId={sectionId}
        reportTypeId={reportTypeId}
        initialTitle={chartTitle.trim() || ""}
        editingChart={
          isEditMode && editingBlock?.type === "chart"
            ? (editingBlock as any)
            : isEditingChartFromPreview && generatedChartData
            ? ({
                id: generatedChartData.id || 0,
                content: {
                  categoryName: generatedChartData.categoryName,
                  selectedIndicators: generatedChartData.selectedIndicators,
                  chartConfig: generatedChartData.chartConfig,
                  chartCustomization: generatedChartData.chartCustomization,
                  chartPosition: generatedChartData.chartPosition,
                  categoryId: generatedChartData.categoryId,
                },
              } as any)
            : undefined
        }
        isEditMode={
          (isEditMode && editingBlock?.type === "chart") ||
          isEditingChartFromPreview
        }
        onChartGenerated={(chartData: any) => {
          const finalTitle = chartTitle.trim() || chartData.title || "Chart";
          setChartTitle(finalTitle);

          const updatedChartData = {
            ...chartData,
            title: finalTitle,
            selectedIndicators: [...(chartData.selectedIndicators || [])],
          };

          setGeneratedChartData(
            updatedChartData as unknown as ChartDataTransfer
          );
          handleCloseChartDialog();
        }}
      />
      <ToastContainer toasts={toasts} />
    </>
  );
}
