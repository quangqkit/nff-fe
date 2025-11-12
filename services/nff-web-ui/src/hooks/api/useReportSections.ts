"use client";

import { useState, useCallback, useEffect } from 'react';
import { useSection, api } from "./useReport";
import type { SectionData } from "@/types";
import type { ReportSection, ReportBlock } from "@/types/reports";

export function useReportSections(reportId?: number) {
  const [sectionsData, setSectionsData] = useState<Record<number, SectionData>>(
    {}
  );
  const [sectionStates, setSectionStates] = useState<Record<number, boolean>>(
    {}
  );
  const [currentSectionId, setCurrentSectionId] = useState<number | null>(null);
  const [livePreviewKey, setLivePreviewKey] = useState(0);

  const { data: currentSectionData, isLoading: isLoadingSection } = useSection(
    reportId || 0,
    currentSectionId || 0,
    !!currentSectionId && !!reportId
  );

  const loadAllSections = useCallback(
    async (reportId: number, sections: ReportSection[]) => {
      const hasBlocksData = sections.some(
        (section) => section.blocks && section.blocks.length > 0
      );

      if (hasBlocksData) {
        const newSectionsData: Record<number, SectionData> = {};
        const newSectionStates: Record<number, boolean> = {};

        for (const section of sections) {
          const blocks: any[] = [];
          const charts: any[] = [];

          if (section.blocks) {
            section.blocks.forEach((block: ReportBlock) => {
              const blockData = {
                id: block.id,
                sectionId: block.sectionId || section.id,
                name: block.name,
                type: block.type,
                content: block.content,
                columns: block.columns || 1,
                orderIndex: block.orderIndex,
                isEnabled: block.isEnabled,
                createdAt: block.createdAt,
                updatedAt: block.updatedAt,
              };

              if (block.type === "CHART") {
                charts.push(blockData);
              } else {
                blocks.push(blockData);
              }
            });
          }

          newSectionsData[section.id] = {
            id: section.id,
            reportId: section.reportId,
            title: section.title,
            content: null,
            orderIndex: section.orderIndex,
            isEnabled: section.isEnabled,
            createdAt: section.createdAt,
            updatedAt: section.updatedAt,
            blocks: blocks.length > 0 ? blocks : undefined,
            charts: charts.length > 0 ? charts : undefined,
          };

          newSectionStates[section.id] = section.isEnabled;
        }

        setSectionsData(newSectionsData);
        setSectionStates(newSectionStates);
        setLivePreviewKey((prev) => prev + 1);
      } else {
        const fetchPromises = sections.map((section) =>
          api.getSection(reportId, section.id).catch((err) => {
            console.error(`Failed to load section ${section.id}:`, err);
            return null;
          })
        );

        const results = await Promise.all(fetchPromises);

        const newSectionsData: Record<number, SectionData> = {};
        const newSectionStates: Record<number, boolean> = {};

        results.forEach((data, index) => {
          if (data) {
            const section = sections[index];
            newSectionsData[section.id] = data;
            newSectionStates[section.id] =
              data.isEnabled !== undefined ? data.isEnabled : true;
          }
        });

        setSectionsData((prev) => ({ ...prev, ...newSectionsData }));
        setSectionStates((prev) => ({ ...prev, ...newSectionStates }));
        setLivePreviewKey((prev) => prev + 1);
      }
    },
    []
  );

  const updateSectionData = useCallback(
    (sectionId: number, data: SectionData) => {
      setSectionsData((prev) => ({
        ...prev,
        [sectionId]: data,
      }));

      setSectionStates((prev) => ({
        ...prev,
        [sectionId]: data.isEnabled !== undefined ? data.isEnabled : true,
      }));
    },
    []
  );

  const refreshLivePreview = useCallback(() => {
    setLivePreviewKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (currentSectionData && currentSectionId) {
      updateSectionData(currentSectionId, currentSectionData);
      refreshLivePreview();
    }
  }, [
    currentSectionData,
    currentSectionId,
    updateSectionData,
    refreshLivePreview,
  ]);

  const fetchSection = useCallback(
    (reportId: number, sectionId: number) => {
      setCurrentSectionId(sectionId);
    },
    [setCurrentSectionId]
  );

  return {
    sectionsData,
    sectionStates,
    currentSectionId,
    livePreviewKey,
    isLoadingSection,
    setSectionsData,
    setSectionStates,
    setCurrentSectionId,
    loadAllSections,
    updateSectionData,
    refreshLivePreview,
    fetchSection,
  };
}
