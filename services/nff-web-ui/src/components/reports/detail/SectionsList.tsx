import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { SectionCard } from '../editor/SectionCard';
import type { ReportSection } from '@/types/reports';

interface SectionsListProps {
  sections: ReportSection[];
  sectionStates: Record<number, boolean>;
  editingSection: number | null;
  sectionTitles: Record<number, string>;
  isPreviewMode: boolean;
  onAddSection: () => void;
  onSectionTitleChange: (sectionId: number, title: string) => void;
  onSaveSectionTitle: (sectionId: number) => void;
  onCancelSectionEdit: (sectionId: number) => void;
  onStartEditSection: (sectionId: number) => void;
  onToggleSectionVisibility: (sectionId: number) => void;
  onAddChart: (sectionId: number) => void;
  onAddBlock: (sectionId: number) => void;
  onDeleteSection: (sectionId: number) => void;
  renderSectionContent: (section: ReportSection) => React.ReactNode;
}

export function SectionsList({
  sections,
  sectionStates,
  editingSection,
  sectionTitles,
  isPreviewMode,
  onAddSection,
  onSectionTitleChange,
  onSaveSectionTitle,
  onCancelSectionEdit,
  onStartEditSection,
  onToggleSectionVisibility,
  onAddChart,
  onAddBlock,
  onDeleteSection,
  renderSectionContent,
}: SectionsListProps) {
  if (!sections || sections.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">
          No sections yet. Add your first section to get started.
        </p>
        <Button onClick={onAddSection} className="gap-2">
          <Plus className="h-4 w-4" />
          Add First Section
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <SectionCard
          key={section.id}
          section={section}
          isEnabled={sectionStates[section.id] !== false}
          isEditing={editingSection === section.id}
          onTitleChange={(title) => onSectionTitleChange(section.id, title)}
          onTitleSave={() => onSaveSectionTitle(section.id)}
          onTitleCancel={() => onCancelSectionEdit(section.id)}
          onStartEdit={() => onStartEditSection(section.id)}
          onToggleVisibility={() => onToggleSectionVisibility(section.id)}
          onAddChart={() => onAddChart(section.id)}
          onAddBlock={() => onAddBlock(section.id)}
          onDelete={() => onDeleteSection(section.id)}
        >
          {renderSectionContent(section)}
        </SectionCard>
      ))}

      {!isPreviewMode && (
        <div className="flex justify-center pt-4">
          <Button onClick={onAddSection} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Section
          </Button>
        </div>
      )}
    </div>
  );
}



