"use client";

import { useState, useCallback, useRef } from "react";
import { useReportTypes, useGenerateReport } from "./useReport";
import { useToast } from "@/hooks/core";
import type { Report } from "@/types";

interface ReportTypeData {
  id: number;
  name: string;
  description?: string;
}

const MIN_LOADING_DURATION = 1200; // 1.2 seconds minimum loading time

export function useReportGeneration() {
  const [selectedReportType, setSelectedReportType] = useState<string>("");
  const [selectedReportTypeId, setSelectedReportTypeId] = useState<
    number | undefined
  >();
  const [generatedReport, setGeneratedReport] = useState<Report | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const loadingStartTimeRef = useRef<number | null>(null);

  const { showToast } = useToast();

  const {
    data: reportTypesData,
    isLoading: isLoadingReportTypes,
    error: reportTypesError,
  } = useReportTypes();

  const generateReportMutation = useGenerateReport();

  const reportTypes = (reportTypesData || []) as unknown as ReportTypeData[];

  const handleReportTypeChange = (value: string) => {
    setSelectedReportType(value);

    const reportType = reportTypes.find((rt) => rt.name === value);
    if (reportType) {
      setSelectedReportTypeId(reportType.id);
    } else {
      setSelectedReportTypeId(undefined);
    }
  };

  const handleGenerateReport = useCallback(
    (onSuccess?: (report: Report) => void) => {
      if (!selectedReportTypeId) {
        showToast({
          title: "Please select a report type",
          type: "error",
          duration: 3000,
        });
        return;
      }

      setIsGenerating(true);
      loadingStartTimeRef.current = Date.now();

      generateReportMutation.mutate(selectedReportTypeId, {
        onSuccess: (data) => {
          const elapsedTime = Date.now() - (loadingStartTimeRef.current || 0);
          const remainingTime = Math.max(0, MIN_LOADING_DURATION - elapsedTime);

          setTimeout(() => {
            setGeneratedReport(data);
            setIsGenerating(false);
            loadingStartTimeRef.current = null;
            onSuccess?.(data);
          }, remainingTime);
        },
        onError: (error) => {
          const elapsedTime = Date.now() - (loadingStartTimeRef.current || 0);
          const remainingTime = Math.max(0, MIN_LOADING_DURATION - elapsedTime);

          setTimeout(() => {
            setIsGenerating(false);
            loadingStartTimeRef.current = null;
            console.error("Failed to generate report:", error);
          }, remainingTime);
        },
      });
    },
    [selectedReportTypeId, generateReportMutation, showToast]
  );

  return {
    reportTypes,
    selectedReportType,
    selectedReportTypeId,
    generatedReport,
    isLoadingReportTypes,
    isGenerating: isGenerating || generateReportMutation.isPending,
    reportTypesError: reportTypesError?.message || null,
    handleReportTypeChange,
    handleGenerateReport,
    setGeneratedReport,
  };
}
