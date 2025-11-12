import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { baseApi } from "@/lib/api/base";
import { useAddSection } from "@/hooks/api";
import { useToast } from "@/hooks/core";
import { QUERY_KEYS } from "@/lib/query/query-client";
import type { ReportSection } from "@/types/reports";
import type { UpdateSectionRequest } from "@/types/reports";

interface UseSectionManagerProps {
  reportId?: number;
  sections?: ReportSection[];
}

export function useSectionManager({ reportId }: UseSectionManagerProps) {
  const [editingSection, setEditingSection] = useState<number | null>(null);
  const [sectionStates, setSectionStates] = useState<Record<number, boolean>>(
    {}
  );
  const [sectionTitles, setSectionTitles] = useState<Record<number, string>>(
    {}
  );
  const [originalSectionTitles, setOriginalSectionTitles] = useState<
    Record<number, string>
  >({});

  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const { mutate: addSection, isPending: isAddingSection } = useAddSection();

  const updateSectionMutation = useMutation({
    mutationFn: ({
      sectionId,
      data,
    }: {
      sectionId: number;
      data: UpdateSectionRequest;
    }) => baseApi.put(`blocks/sections/${sectionId}`, data),
    onSuccess: (data, { sectionId }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SECTIONS.ALL });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.REPORTS.ALL });
      showToast({
        title: "Section Updated",
        description: "Section title has been updated successfully.",
        type: "success",
        duration: 3000,
      });
    },
    onError: (error) => {
      console.error("Failed to update section:", error);
      showToast({
        title: "Failed to update section",
        type: "error",
        duration: 3000,
      });
    },
  });

  const toggleSectionMutation = useMutation({
    mutationFn: (sectionId: number) =>
      baseApi.patch(`/blocks/sections/${sectionId}/toggle`),
    onSuccess: (data, sectionId) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SECTIONS.ALL });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.REPORTS.ALL });
    },
    onError: (error) => {
      console.error("Failed to toggle section:", error);
      showToast({
        title: "Failed to toggle section visibility",
        type: "error",
        duration: 3000,
      });
    },
  });

  const deleteSectionMutation = useMutation({
    mutationFn: (sectionId: number) =>
      baseApi.delete(`blocks/sections/${sectionId}`),
    onSuccess: (data, sectionId) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SECTIONS.ALL });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.REPORTS.ALL });
      showToast({
        title: "Section Deleted",
        description: "The section has been removed from your report.",
        type: "success",
        duration: 3000,
      });
      setSectionStates((prev) => {
        const newState = { ...prev };
        delete newState[sectionId];
        return newState;
      });
      setSectionTitles((prev) => {
        const newState = { ...prev };
        delete newState[sectionId];
        return newState;
      });
    },
    onError: (error) => {
      console.error("Failed to delete section:", error);
      showToast({
        title: "Failed to delete section",
        type: "error",
        duration: 3000,
      });
    },
  });

  const initializeSectionStates = (sections: ReportSection[]) => {
    const states: Record<number, boolean> = {};
    const titles: Record<number, string> = {};

    sections.forEach((section) => {
      states[section.id] = section.isEnabled !== false;
      titles[section.id] = section.title;
    });

    setSectionStates(states);
    setSectionTitles(titles);
    setOriginalSectionTitles(titles);
  };

  const handleStartEditSection = (sectionId: number, currentTitle: string) => {
    setEditingSection(sectionId);
    setOriginalSectionTitles((prev) => ({
      ...prev,
      [sectionId]: currentTitle,
    }));
  };

  const handleSaveSectionTitle = (sectionId: number, newTitle: string) => {
    updateSectionMutation.mutate(
      { sectionId, data: { title: newTitle } },
      {
        onSuccess: () => {
          setSectionTitles((prev) => ({ ...prev, [sectionId]: newTitle }));
          setOriginalSectionTitles((prev) => ({
            ...prev,
            [sectionId]: newTitle,
          }));
          setEditingSection(null);
        },
        onError: () => {
          setSectionTitles((prev) => ({
            ...prev,
            [sectionId]: originalSectionTitles[sectionId],
          }));
        },
      }
    );
  };

  const handleCancelEditSection = (sectionId: number) => {
    setSectionTitles((prev) => ({
      ...prev,
      [sectionId]: originalSectionTitles[sectionId],
    }));
    setEditingSection(null);
  };

  const handleToggleSectionVisibility = (sectionId: number) => {
    const newState = !sectionStates[sectionId];

    toggleSectionMutation.mutate(sectionId, {
      onSuccess: () => {
        setSectionStates((prev) => ({ ...prev, [sectionId]: newState }));
      },
    });
  };

  const handleAddSection = () => {
    if (!reportId) {
      showToast({
        title: "No report selected",
        type: "error",
        duration: 3000,
      });
      return;
    }

    addSection(reportId, {
      onSuccess: (newSection) => {
        showToast({
          title: "Section Added",
          description: "A new section has been added to your report.",
          type: "success",
          duration: 3000,
        });
        setSectionStates((prev) => ({ ...prev, [newSection.id]: true }));
        setSectionTitles((prev) => ({
          ...prev,
          [newSection.id]: newSection.title,
        }));
      },
      onError: (error) => {
        console.error("Failed to add section:", error);
        showToast({
          title: "Failed to add section",
          type: "error",
          duration: 3000,
        });
      },
    });
  };

  const handleDeleteSection = (sectionId: number) => {
    deleteSectionMutation.mutate(sectionId);
  };

  return {
    editingSection,
    sectionStates,
    sectionTitles,
    isAddingSection,
    isUpdatingSection: updateSectionMutation.isPending,
    isTogglingSection: toggleSectionMutation.isPending,
    isDeletingSection: deleteSectionMutation.isPending,

    initializeSectionStates,
    handleStartEditSection,
    handleSaveSectionTitle,
    handleCancelEditSection,
    handleToggleSectionVisibility,
    handleAddSection,
    handleDeleteSection,
  };
}
