import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/core/useToast";
import { baseApi } from "@/lib/api/base";
import { BlockData, ChartData, SectionData } from "@/types";

interface ReportBlock {
  id: number;
  sectionId: number;
  name: string;
  type: string;
  content: Record<string, unknown>;
  columns?: number;
  orderIndex: number;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}
import { API_CONFIG } from "@/constants/api";
import { QUERY_KEYS } from "@/lib/query/query-client";

const api = {
  toggleSection: (sectionId: number) =>
    baseApi.patch<{ isEnabled: boolean }>(
      `/blocks/sections/${sectionId}/toggle`
    ),

  toggleBlock: (blockId: number) =>
    baseApi.patch<{ isEnabled: boolean }>(`/blocks/${blockId}/toggle`),

  deleteBlock: (blockId: number) =>
    baseApi.delete<{ success: boolean }>(`/blocks/${blockId}`),

  addSection: (reportId: number) =>
    baseApi.post<SectionData>(`/blocks/sections/${reportId}`, {
      title: `Section ${Date.now()}`,
      orderIndex: 0,
    }),

  updateSection: (sectionId: number, data: { title: string }) =>
    baseApi.put<SectionData>(`/blocks/sections/${sectionId}`, data),
};

export const useReportActions = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [blockToDelete, setBlockToDelete] = useState<number | null>(null);
  const [editingBlock, setEditingBlock] = useState<ReportBlock | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAddingNewSection, setIsAddingNewSection] = useState(false);

  const toggleSectionMutation = useMutation({
    mutationFn: api.toggleSection,
    onSuccess: (data, sectionId) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SECTIONS.ALL });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.REPORTS.ALL });
    },
    onError: (error) => {
      console.error("Error toggling section:", error);
      showToast({
        title: "Error",
        description: "Failed to toggle section. Please try again.",
        type: "error",
      });
    },
  });

  const toggleSection = useCallback(
    async (
      sectionId: number,
      updateStates: (sectionId: number, isEnabled: boolean) => void,
      updateReport: (sectionId: number, isEnabled: boolean) => void
    ) => {
      toggleSectionMutation.mutate(sectionId, {
        onSuccess: (data) => {
          updateStates(sectionId, data.isEnabled);
          updateReport(sectionId, data.isEnabled);
        },
      });
    },
    [toggleSectionMutation]
  );

  const toggleBlockMutation = useMutation({
    mutationFn: api.toggleBlock,
    onSuccess: (data, blockId) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CHARTS.ALL });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.REPORTS.ALL });
    },
    onError: (error) => {
      console.error("Error toggling block:", error);
      showToast({
        title: "Error",
        description: "Failed to toggle block. Please try again.",
        type: "error",
      });
    },
  });

  const toggleBlock = useCallback(
    async (
      blockId: number,
      updateSectionsData: (blockId: number, isEnabled: boolean) => void,
      updateReport: (blockId: number, isEnabled: boolean) => void
    ) => {
      toggleBlockMutation.mutate(blockId, {
        onSuccess: (data) => {
          updateSectionsData(blockId, data.isEnabled);
          updateReport(blockId, data.isEnabled);
        },
      });
    },
    [toggleBlockMutation]
  );

  const deleteBlockMutation = useMutation({
    mutationFn: api.deleteBlock,
    onSuccess: (data, blockId) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CHARTS.ALL });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.REPORTS.ALL });
      showToast({
        title: "Success",
        description: "Block deleted successfully!",
        type: "success",
      });
    },
    onError: (error) => {
      console.error("Error deleting block:", error);
      showToast({
        title: "Error",
        description: "Failed to delete block. Please try again.",
        type: "error",
      });
    },
  });

  const deleteBlock = useCallback(
    async (blockId: number, updateSectionsData: (blockId: number) => void) => {
      setBlockToDelete(blockId);
      deleteBlockMutation.mutate(blockId, {
        onSuccess: () => {
          updateSectionsData(blockId);
          setBlockToDelete(null);
        },
        onError: () => {
          setBlockToDelete(null);
        },
      });
    },
    [deleteBlockMutation]
  );

  const exportChartJson = useCallback(
    async (chart: ChartData) => {
      try {
        let response;
        let useNewEndpoint = true;

        try {
          response = await fetch(
            `${API_CONFIG.BASE_URL}/charts/export/block/${chart.id}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
            }
          );
        } catch (error) {
          useNewEndpoint = false;
          response = await fetch(
            `${API_CONFIG.BASE_URL}/blocks/${chart.id}/export`
          );
        }

        if (!response.ok) {
          if (useNewEndpoint) {
            response = await fetch(
              `${API_CONFIG.BASE_URL}/blocks/${chart.id}/export`
            );
            useNewEndpoint = false;
          }

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to export chart data");
          }
        }

        const contentDisposition = response.headers.get("Content-Disposition");
        const responseData = await response.clone().json();
        const chartId = responseData?.[0]?.chart_id || responseData?.chart_id;

        const now = new Date();
        const dateStr = now.toISOString().split("T")[0].replace(/-/g, "");
        const timeStr = now
          .toISOString()
          .split("T")[1]
          .split(".")[0]
          .replace(/:/g, "")
          .substring(0, 4);

        let filename = chartId
          ? `${chartId.replace(
              /[^a-zA-Z0-9.]/g,
              "_"
            )}_${dateStr}_${timeStr}.json`
          : `indicator_${dateStr}_${timeStr}.json`;

        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/);
          if (filenameMatch) {
            filename = filenameMatch[1];
          }
        }

        if (useNewEndpoint) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        } else {
          const data = await response.json();
          const jsonString = JSON.stringify(data, null, 2);
          const blob = new Blob([jsonString], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }
      } catch (error) {
        console.error("Export JSON error:", error);
        showToast({
          title: "Error",
          description: "Failed to export chart data. Please try again.",
          type: "error",
        });
      }
    },
    [showToast]
  );

  const addSectionMutation = useMutation({
    mutationFn: api.addSection,
    onSuccess: (data, reportId) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SECTIONS.ALL });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.REPORTS.ALL });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.REPORTS.WITH_BLOCKS(reportId.toString()),
      });
    },
    onError: (error) => {
      console.error("Error adding section:", error);
      showToast({
        title: "Failed to Add Section",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred while adding the section.",
        type: "error",
      });
    },
  });

  const addSection = useCallback(
    async (reportId: number, onSuccess: (newSection: any) => void) => {
      setIsAddingNewSection(true);

      await new Promise((resolve) => setTimeout(resolve, 300));

      addSectionMutation.mutate(reportId, {
        onSuccess: (data) => {
          onSuccess(data);
          setTimeout(() => setIsAddingNewSection(false), 500);
        },
        onError: () => {
          setIsAddingNewSection(false);
        },
      });
    },
    [addSectionMutation]
  );

  const duplicateBlock = useCallback(
    (block: ReportBlock, sectionsData: Record<number, SectionData>) => {
      const sectionId = block.sectionId;
      const sectionData = sectionsData[sectionId];

      let maxOrder = 0;
      if (sectionData && sectionData.blocks) {
        maxOrder = Math.max(
          ...sectionData.blocks.map((b: BlockData) => b.orderIndex),
          0
        );
      }

      const { id, ...blockWithoutId } = block;

      const editingBlock = {
        ...blockWithoutId,
        id: 0, // Temporary ID for new block
        name: `Copy of ${block.name}`,
        orderIndex: maxOrder + 1,
      } as ReportBlock;

      setIsEditMode(false);

      return { sectionId, editingBlock };
    },
    []
  );

  const editBlock = useCallback((block: BlockData) => {
    const reportBlock: ReportBlock = {
      id: block.id,
      sectionId: block.sectionId,
      name: block.name,
      type: block.type,
      content: block.content as Record<string, unknown>,
      columns: block.columns,
      orderIndex: block.orderIndex,
      isEnabled: block.isEnabled ?? true,
      createdAt: block.createdAt,
      updatedAt: block.updatedAt,
    };
    setEditingBlock(reportBlock);
    setIsEditMode(true);

    return { sectionId: block.sectionId, editingBlock: reportBlock };
  }, []);

  return {
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
  };
};

export const useSectionEditing = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [editingSection, setEditingSection] = useState<number | null>(null);
  const [sectionOriginalTitles, setSectionOriginalTitles] = useState<
    Record<number, string>
  >({});
  const [beforeEditSectionTitles, setBeforeEditSectionTitles] = useState<
    Record<number, string>
  >({});

  const updateSectionMutation = useMutation({
    mutationFn: ({
      sectionId,
      data,
    }: {
      sectionId: number;
      data: { title: string };
    }) => api.updateSection(sectionId, data),
    onSuccess: (data, { sectionId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SECTIONS.ALL });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.REPORTS.ALL });
    },
    onError: (error) => {
      console.error("Error saving section title:", error);
      showToast({
        title: "Failed to save section title",
        type: "error",
        duration: 3000,
      });
    },
  });

  const saveSectionTitle = useCallback(
    async (
      sectionId: number,
      newTitle: string,
      originalTitle: string,
      updateReport: (sectionId: number, title: string) => void
    ) => {
      if (newTitle.trim() === originalTitle.trim()) {
        setEditingSection(null);
        return;
      }

      updateSectionMutation.mutate(
        { sectionId, data: { title: newTitle } },
        {
          onSuccess: () => {
            updateReport(sectionId, newTitle);
            setEditingSection(null);
          },
        }
      );
    },
    [updateSectionMutation]
  );

  const cancelSectionEdit = useCallback(
    (
      sectionId: number,
      beforeEditTitle: string,
      updateReport: (sectionId: number, title: string) => void
    ) => {
      if (beforeEditTitle) {
        updateReport(sectionId, beforeEditTitle);
      }
      setEditingSection(null);
    },
    []
  );

  const startSectionEdit = useCallback(
    (sectionId: number, currentTitle: string) => {
      setSectionOriginalTitles((prev) => ({
        ...prev,
        [sectionId]: currentTitle,
      }));
      setBeforeEditSectionTitles((prev) => ({
        ...prev,
        [sectionId]: currentTitle,
      }));
      setEditingSection(sectionId);
    },
    []
  );

  return {
    editingSection,
    sectionOriginalTitles,
    beforeEditSectionTitles,
    setEditingSection,
    saveSectionTitle,
    cancelSectionEdit,
    startSectionEdit,
  };
};
