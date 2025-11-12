
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useReportWithBlocks } from '@/hooks/api';
import { useReportEditor } from './useReportEditor';
import { useSectionManager } from './useSectionManager';
import { useChartManager } from './useChartManager';
import type { ReportSection } from '@/types/reports';

interface UseReportDetailProps {
  reportId: string;
  mode?: 'preview' | 'edit';
}

export function useReportDetail({ reportId, mode = 'edit' }: UseReportDetailProps) {
  const router = useRouter();
  const [isPreviewMode, setIsPreviewMode] = useState(mode === 'preview');

  const numericReportId = parseInt(reportId);

  const { data: report, isLoading, error } = useReportWithBlocks(numericReportId);

  const reportEditor = useReportEditor({
    reportId: numericReportId,
    initialTitle: report?.title || '',
    initialSummary: report?.summary || '',
  });

  const sectionManager = useSectionManager({
    reportId: numericReportId,
    sections: report?.sections || [],
  });

  const chartManager = useChartManager();

  useEffect(() => {
    if (report?.sections) {
      sectionManager.initializeSectionStates(report.sections);
    }
  }, [report?.sections]);

  const handleBack = () => {
    router.push('/reports');
  };

  const handleToggleMode = () => {
    const newMode = isPreviewMode ? 'edit' : 'preview';
    setIsPreviewMode(!isPreviewMode);
    router.push(`/reports/${reportId}?mode=${newMode}`);
  };

  const handleSectionTitleChange = (sectionId: number, title: string) => {
    sectionManager.handleStartEditSection(sectionId, title);
  };

  const handleSaveSectionTitle = (sectionId: number) => {
    const title = sectionManager.sectionTitles[sectionId];
    if (title) {
      sectionManager.handleSaveSectionTitle(sectionId, title);
    }
  };

  const handleCancelSectionEdit = (sectionId: number) => {
    sectionManager.handleCancelEditSection(sectionId);
  };

  const handleStartEditSection = (sectionId: number) => {
    const section = report?.sections?.find((s: ReportSection) => s.id === sectionId);
    if (section) {
      sectionManager.handleStartEditSection(sectionId, section.title);
    }
  };

  return {
    report,
    isLoading,
    error,
    isPreviewMode,
    
    ...reportEditor,

    ...sectionManager,

    ...chartManager,

    handleBack,
    handleToggleMode,
    handleSectionTitleChange,
    handleSaveSectionTitle,
    handleCancelSectionEdit,
    handleStartEditSection,
  };
}



