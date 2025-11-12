"use client";
import {
  FileText,
  BarChart3,
  Table,
  List,
  StickyNote,
  Eye,
} from "lucide-react";

import { ChartPreview } from "@/components/chart/ChartPreview";

interface Section {
  id: number;
  title: string;
  isEnabled: boolean;
  orderIndex: number;
  blocks: Block[];
}
interface Block {
  id: number;
  name: string;
  type: "TEXT" | "CHART" | "TABLE" | "BULLETS" | "NOTES";
  content: {
    plainText?: string;
    richText?: string;
    chartTitle?: string;
    headers?: string[];
    rows?: string[][];
    title?: string;
    bullets?: Array<{
      id: string;
      text: string;
      level: number;
      style?: "bullet" | "number" | "dash" | "arrow";
    }>;
    noteType?: "info" | "warning" | "error" | "success" | "neutral";
    noteText?: string;
    backgroundColor?: string;
    borderColor?: string;
  };
  columns: number;
  orderIndex: number;
  isEnabled?: boolean;
}

interface LivePreviewProps {
  sections: Section[];
  onEditBlock?: (block: Block) => void;
  isEditMode?: boolean;
}

const getBlockIcon = (type: string) => {
  switch (type) {
    case "TEXT":
      return <FileText className="h-4 w-4" />;
    case "CHART":
      return <BarChart3 className="h-4 w-4" />;
    case "TABLE":
      return <Table className="h-4 w-4" />;
    case "BULLETS":
      return <List className="h-4 w-4" />;
    case "NOTES":
      return <StickyNote className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

const getBlockColor = (type: string) => {
  // Use consistent primary color for all block types
  return "bg-[#f0f2ff] text-[#707FDD]";
};

const getColumnClass = (columns: number) => {
  const columnMap: Record<number, string> = {
    1: "col-span-1",
    2: "col-span-2",
    3: "col-span-3",
    4: "col-span-4",
    5: "col-span-5",
    6: "col-span-6",
    7: "col-span-7",
    8: "col-span-8",
    9: "col-span-9",
    10: "col-span-10",
    11: "col-span-11",
    12: "col-span-12",
  };
  return columnMap[columns] || "col-span-12";
};

export function LivePreview({ sections }: LivePreviewProps) {
  const allBlocks = sections
    .filter((section) => section.isEnabled)
    .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
    .flatMap((section, sectionIndex) =>
      section.blocks
        .filter((block) => block.isEnabled !== false)
        .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
        .map((block, blockIndex) => ({
          ...block,
          sectionTitle: section.title,
          sectionOrder: section.orderIndex || 0,
          uniqueKey: `block-${sectionIndex}-${blockIndex}-${block.id}`,
        }))
    );

  if (allBlocks.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Eye className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">
            Live Preview
          </h3>
          <p className="text-gray-500">
            Add sections and blocks to see your report preview here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="h-full overflow-y-auto hide-scrollbar">
        <div className="grid grid-cols-12 gap-6 pb-4">
          {allBlocks.map((block) => (
            <div
              key={block.uniqueKey}
              className={`${getColumnClass(block.columns)}`}
            >
              {block.type === "TEXT" && (
                <div className="group p-6 bg-white dark:bg-black border border-[#c7d2fe] rounded-lg shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center mb-4">
                    <div className="w-3 h-3 bg-[#707FDD] rounded-full mr-3"></div>
                    <h4 className="font-semibold text-lg text-gray-800 dark:text-white">
                      {block.name}
                    </h4>
                  </div>
                  <div className="text-gray-700 dark:text-gray-300 leading-relaxed bg-[#f0f2ff] dark:bg-gray-800 p-4 rounded-lg border-l-4 border-[#707FDD]">
                    {block.content.plainText
                      ? block.content.plainText.replace(/<[^>]*>/g, "")
                      : "Text content will appear here..."}
                  </div>
                </div>
              )}

              {block.type === "CHART" && (
                <div className="rounded-xl">
                  {(() => {
                    try {
                      const content = block.content as any;

                      if (!content) {
                        return (
                          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg m-2">
                            <div className="text-center text-gray-500">
                              <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                              <p className="text-sm">
                                Chart configuration missing
                              </p>
                            </div>
                          </div>
                        );
                      }

                      let selectedIndicators = content?.selectedIndicators;

                      if (!selectedIndicators && content?.indicatorConfigs) {
                        selectedIndicators = content.indicatorConfigs.map(
                          (config: any) => ({
                            indicatorId:
                              config.indicatorId?.toString() ||
                              config.id?.toString() ||
                              "",
                            chartType: config.chartType || "line",
                            dateRange: {
                              preset: "CUSTOM",
                              customStart: config.dateRangeStart,
                              customEnd: config.dateRangeEnd,
                            },
                          })
                        );
                      }

                      const hasValidIndicators =
                        selectedIndicators &&
                        Array.isArray(selectedIndicators) &&
                        selectedIndicators.length > 0;

                      if (hasValidIndicators) {
                        return (
                          <div
                            className="w-full border border-gray-200 shadow-sm rounded-sm"
                            style={{ height: "400px" }}
                          >
                            <ChartPreview
                              key={`chart-${block.id}-${
                                block.uniqueKey || Date.now()
                              }`}
                              selectedIndicators={selectedIndicators}
                              customization={
                                content?.chartCustomization ||
                                content?.customization ||
                                {}
                              }
                              title={
                                content?.chartTitle || block.name || "Chart"
                              }
                              indicatorNames={content?.indicatorNames || {}}
                              className="h-full border-0"
                            />
                          </div>
                        );
                      } else {
                        return (
                          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg m-2">
                            <div className="text-center text-gray-500">
                              <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                              <p className="text-sm">Chart will appear here</p>
                              <p className="text-xs text-gray-400 mt-1">
                                {selectedIndicators
                                  ? "No valid indicators selected"
                                  : "Configure chart indicators"}
                              </p>
                            </div>
                          </div>
                        );
                      }
                    } catch (error) {
                      console.error("Chart block rendering error:", error);
                      return (
                        <div className="h-64 flex items-center justify-center bg-red-50 rounded-lg m-2 border border-red-200">
                          <div className="text-center text-red-600">
                            <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                            <p className="text-sm font-medium">Chart Error</p>
                            <p className="text-xs text-red-500 mt-1">
                              Failed to render chart block
                            </p>
                          </div>
                        </div>
                      );
                    }
                  })()}
                </div>
              )}

              {block.type === "TABLE" && (
                <div className="group p-6 bg-white dark:bg-black border border-[#c7d2fe] rounded-lg shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center mb-4">
                    <div className="w-3 h-3 bg-[#707FDD] rounded-full mr-3"></div>
                    <h4 className="font-semibold text-lg text-gray-800 dark:text-white">
                      {block.name}
                    </h4>
                  </div>
                  <div className="bg-[#f0f2ff] p-4 rounded-xl border border-[#c7d2fe]">
                    <div className="flex items-center mb-3">
                      <Table className="h-5 w-5 text-[#707FDD] mr-2" />
                      <span className="font-semibold text-[#707FDD]">
                        Table: {block.content.headers?.length || 0} columns
                      </span>
                    </div>
                    <div className="text-sm text-[#707FDD]">
                      {block.content.rows?.length || 0} rows
                    </div>
                  </div>
                </div>
              )}

              {block.type === "BULLETS" && (
                <div className="group p-6 bg-white dark:bg-black border border-[#c7d2fe] rounded-lg shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center mb-4">
                    <div className="w-3 h-3 bg-[#707FDD] rounded-full mr-3"></div>
                    <h4 className="font-semibold text-lg text-gray-800 dark:text-white">
                      {block.name}
                    </h4>
                  </div>
                  <div className="bg-[#f0f2ff] p-4 rounded-xl border border-[#c7d2fe]">
                    {block.content.bullets &&
                    block.content.bullets.length > 0 ? (
                      <ul className="space-y-2">
                        {block.content.bullets.map(
                          (bullet: any, index: number) => (
                            <li
                              key={bullet.id || index}
                              className="flex items-center"
                            >
                              <span className="text-[#707FDD] mr-2">•</span>
                              <span className="text-gray-700 text-sm">
                                {bullet.text}
                              </span>
                            </li>
                          )
                        )}
                      </ul>
                    ) : (
                      <div className="flex items-center">
                        <List className="h-5 w-5 text-[#707FDD] mr-2" />
                        <span className="text-[#707FDD] text-sm">
                          No bullet points yet
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {block.type === "NOTES" && (
                <div className="group p-6 bg-white dark:bg-black border border-[#c7d2fe] rounded-lg shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center mb-4">
                    <div className="w-3 h-3 bg-[#707FDD] rounded-full mr-3"></div>
                    <h4 className="font-semibold text-lg text-gray-800 dark:text-white">
                      {block.name}
                    </h4>
                  </div>
                  <div className="text-gray-700 dark:text-gray-300 leading-relaxed bg-[#f0f2ff] dark:bg-gray-800 p-4 rounded-lg border-l-4 border-[#707FDD]">
                    {block.content.noteText
                      ? block.content.noteText.replace(/<[^>]*>/g, "")
                      : "No note content yet..."}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
