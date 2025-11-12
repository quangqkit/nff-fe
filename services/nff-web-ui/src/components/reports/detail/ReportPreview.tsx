import { Card, CardContent } from "@/components/ui/card";
import { LivePreview } from "../editor/LivePreview";
import { GeneratedReport, ReportSection } from "@/types/reports";
import { SectionData } from "@/types";
import { REPORT_UI_TEXT } from "@/constants/reports";

interface ReportPreviewProps {
  generatedReport: GeneratedReport;
  sectionsData: Record<number, SectionData>;
  livePreviewKey: number;
  isPreviewMode?: boolean;
  onEditBlock?: (block: any) => void;
}

export const ReportPreview = ({
  generatedReport,
  sectionsData,
  livePreviewKey,
  isPreviewMode = false,
  onEditBlock,
}: ReportPreviewProps) => {
  if (!generatedReport?.sections) {
    return (
      <Card className="h-full">
        <CardContent className="h-full flex flex-col">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground">
              {REPORT_UI_TEXT.MESSAGES.LIVE_PREVIEW}
            </h3>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center py-8 text-muted-foreground">
              {REPORT_UI_TEXT.MESSAGES.NO_SECTIONS}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (Object.keys(sectionsData).length === 0) {
    return (
      <Card className="h-full">
        <CardContent className="h-full flex flex-col">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground">
              {REPORT_UI_TEXT.MESSAGES.LIVE_PREVIEW}
            </h3>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center py-8 text-muted-foreground">
              {REPORT_UI_TEXT.MESSAGES.LOADING_SECTIONS}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const processedSections = generatedReport.sections.map(
    (section: ReportSection) => {
      const allBlocks = [
        ...(sectionsData[section.id]?.blocks || []),
        ...(sectionsData[section.id]?.charts || []),
      ];

      const uniqueBlocks = allBlocks.filter(
        (block, index, self) =>
          self.findIndex((b) => b.id === block.id) === index
      );

      const sectionBlocks = uniqueBlocks.map((block: any) => ({
        id: block.id,
        name: block.name || `Block ${block.id}`,
        type: block.type as "TEXT" | "CHART" | "TABLE" | "BULLETS" | "NOTES",
        content: {
          ...(block.content || {}),
          bullets: Array.isArray(block.content?.bullets)
            ? block.content.bullets.map((bullet: any, index: number) => {
                if (typeof bullet === "object" && bullet !== null) {
                  return {
                    id: bullet.id || `bullet-${index}`,
                    text: bullet.text || bullet,
                    level: bullet.level || 0,
                    style: bullet.style || ("bullet" as const),
                  };
                }
                return {
                  id: `bullet-${index}`,
                  text: bullet,
                  level: 0,
                  style: "bullet" as const,
                };
              })
            : [],
          noteType: block.content?.noteType as
            | "info"
            | "warning"
            | "error"
            | "success"
            | "neutral"
            | undefined,
        },
        columns: block.columns || 12,
        orderIndex: block.orderIndex || 0,
        isEnabled: block.isEnabled !== false,
      }));

      return {
        id: section.id,
        title: section.title,
        isEnabled: section.isEnabled,
        orderIndex: section.orderIndex,
        blocks: sectionBlocks,
      };
    }
  );

  return (
    <Card className="h-full">
      <CardContent className="h-full flex flex-col">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground">
            {REPORT_UI_TEXT.MESSAGES.LIVE_PREVIEW}
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar">
          <LivePreview
            key={livePreviewKey}
            sections={processedSections}
            isEditMode={!isPreviewMode}
            onEditBlock={onEditBlock}
          />
        </div>
      </CardContent>
    </Card>
  );
};
