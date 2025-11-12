import { useState } from "react";
import { useDeleteChart, useUpdateChart } from "@/hooks/api";
import { useToast } from "@/hooks/core";
import type { ChartDataStructure } from "@/types";

export function useChartManager() {
  const [showChartDialog, setShowChartDialog] = useState(false);
  const [chartDialogStep, setChartDialogStep] = useState(0);
  const [currentSectionId, setCurrentSectionId] = useState<number | null>(null);
  const [editingChart, setEditingChart] = useState<ChartDataStructure | null>(
    null
  );
  const [isEditMode, setIsEditMode] = useState(false);

  const { showToast } = useToast();
  const { mutate: deleteChart, isPending: isDeletingChart } = useDeleteChart();
  const { isPending: isUpdatingChart } = useUpdateChart();

  const handleAddChart = (sectionId: number) => {
    setCurrentSectionId(sectionId);
    setIsEditMode(false);
    setEditingChart(null);
    setChartDialogStep(0);
    setShowChartDialog(true);
  };

  const handleEditChart = (chart: ChartDataStructure, sectionId: number) => {
    setCurrentSectionId(sectionId);
    setIsEditMode(true);
    setEditingChart(chart);
    setChartDialogStep(0);
    setShowChartDialog(true);
  };

  const handleDeleteChart = (chartId: number) => {
    deleteChart(chartId, {
      onSuccess: () => {
        showToast({
          title: "Chart Deleted",
          description: "The chart has been removed successfully.",
          type: "success",
          duration: 3000,
        });
      },
      onError: (error) => {
        console.error("Failed to delete chart:", error);
        showToast({
          title: "Failed to delete chart",
          type: "error",
          duration: 3000,
        });
      },
    });
  };

  const handleCloseChartDialog = () => {
    setShowChartDialog(false);
    setChartDialogStep(0);
    setEditingChart(null);
    setIsEditMode(false);
    setCurrentSectionId(null);
  };

  const handleExportChartJson = async (chartId: number) => {
    try {
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || ""
        }/charts/export/block/${chartId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to export chart data");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chart-${chartId}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showToast({
        title: "Chart Exported",
        description: "The chart data has been exported successfully.",
        type: "success",
        duration: 3000,
      });
    } catch (error) {
      console.error("Failed to export chart:", error);
      showToast({
        title: "Failed to export chart",
        type: "error",
        duration: 3000,
      });
    }
  };

  return {
    showChartDialog,
    chartDialogStep,
    currentSectionId,
    editingChart,
    isEditMode,
    isDeletingChart,
    isUpdatingChart,

    setChartDialogStep,
    handleAddChart,
    handleEditChart,
    handleDeleteChart,
    handleCloseChartDialog,
    handleExportChartJson,
  };
}
