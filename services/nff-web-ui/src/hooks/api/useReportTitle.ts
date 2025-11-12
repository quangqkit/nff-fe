"use client";

import { useState, useCallback } from "react";
import { useUpdateReport } from "./useReport";
import { useToast } from "@/hooks/core";

export function useReportTitle() {
  const [reportTitle, setReportTitle] = useState("");
  const [reportSummary, setReportSummary] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [originalTitle, setOriginalTitle] = useState("");
  const [originalSummary, setOriginalSummary] = useState("");
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  const [isSavingSummary, setIsSavingSummary] = useState(false);

  const { showToast } = useToast();
  const { mutate: updateReport, isPending: isUpdatingReport } =
    useUpdateReport();

  const saveTitle = useCallback(
    (reportId: number) => {
      if (reportTitle.trim() === originalTitle.trim()) {
        setIsEditingTitle(false);
        return;
      }

      setIsSavingTitle(true);
      updateReport(
        {
          reportId,
          updateData: { title: reportTitle },
        },
        {
          onSuccess: () => {
            setOriginalTitle(reportTitle);
            setIsEditingTitle(false);
            setIsSavingTitle(false);
          },
          onError: (error) => {
            console.error("Error saving title:", error);
            setIsSavingTitle(false);
            showToast({
              title: "Failed to save report title",
              type: "error",
              duration: 3000,
            });
          },
        }
      );
    },
    [reportTitle, originalTitle, updateReport, showToast]
  );

  const saveSummary = useCallback(
    (reportId: number) => {
      if (reportSummary.trim() === originalSummary.trim()) return;

      setIsSavingSummary(true);
      updateReport(
        {
          reportId,
          updateData: { description: reportSummary },
        },
        {
          onSuccess: () => {
            setOriginalSummary(reportSummary);
            setIsSavingSummary(false);
          },
          onError: (error) => {
            console.error("Error saving summary:", error);
            setIsSavingSummary(false);
            showToast({
              title: "Failed to save report summary",
              type: "error",
              duration: 3000,
            });
          },
        }
      );
    },
    [reportSummary, originalSummary, updateReport, showToast]
  );

  const initializeTitle = useCallback((title: string, summary: string) => {
    setReportTitle(title);
    setReportSummary(summary);
    setOriginalTitle(title);
    setOriginalSummary(summary);
  }, []);

  return {
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
    setOriginalTitle,
    setOriginalSummary,
    saveTitle,
    saveSummary,
    initializeTitle,
  };
}
