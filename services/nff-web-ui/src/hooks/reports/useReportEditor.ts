import { useState } from "react";
import { useUpdateReport } from "@/hooks/api";
import { useToast } from "@/hooks/core";

interface UseReportEditorProps {
  reportId?: number;
  initialTitle?: string;
  initialSummary?: string;
}

export function useReportEditor({
  reportId,
  initialTitle = "",
  initialSummary = "",
}: UseReportEditorProps) {
  const [reportTitle, setReportTitle] = useState(initialTitle);
  const [reportSummary, setReportSummary] = useState(initialSummary);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [originalTitle, setOriginalTitle] = useState(initialTitle);

  const { showToast } = useToast();
  const { mutate: updateReport, isPending: isSaving } = useUpdateReport();

  const handleSaveTitle = async (newTitle: string) => {
    if (!reportId || !newTitle.trim()) {
      return;
    }

    if (newTitle.trim() === originalTitle.trim()) {
      setIsEditingTitle(false);
      return;
    }

    return new Promise<void>((resolve, reject) => {
      updateReport(
        { reportId, updateData: { title: newTitle } },
        {
          onSuccess: () => {
            setOriginalTitle(newTitle);
            setReportTitle(newTitle);
            setIsEditingTitle(false);
            resolve();
          },
          onError: (error) => {
            console.error("Error saving report title:", error);
            setReportTitle(originalTitle);
            showToast({
              title: "Failed to save report title",
              type: "error",
              duration: 3000,
            });
            reject(error);
          },
        }
      );
    });
  };

  const handleCancelEdit = () => {
    setReportTitle(originalTitle);
    setIsEditingTitle(false);
  };

  const handleStartEdit = () => {
    setIsEditingTitle(true);
  };

  return {
    // State
    reportTitle,
    reportSummary,
    isEditingTitle,
    isSaving,

    // Actions
    setReportTitle,
    setReportSummary,
    handleSaveTitle,
    handleCancelEdit,
    handleStartEdit,
  };
}
