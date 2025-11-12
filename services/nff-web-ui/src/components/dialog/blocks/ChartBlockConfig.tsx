import { ChartPreview } from "@/components/chart/ChartPreview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumberInput } from "@/components/ui/number-input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChartDataTransfer } from "@/types";
import { Edit, HelpCircle, Loader2, Plus } from "lucide-react";
import { useEffect, useState } from "react";

interface ChartBlockConfigProps {
  blockName: string;
  setBlockName: (name: string) => void;
  order: number;
  setOrder: (order: number) => void;
  columns: number;
  setColumns: (columns: number) => void;
  supportPrompt: string;
  setSupportPrompt: (prompt: string) => void;
  chartTitle: string;
  setChartTitle: (title: string) => void;
  onAddChart: () => void;
  onEditChart?: () => void;
  generatedChartData?: ChartDataTransfer;
  isEditMode?: boolean;
}

export function ChartBlockConfig({
  blockName,
  setBlockName,
  order,
  setOrder,
  columns,
  setColumns,
  chartTitle,
  setChartTitle,
  onAddChart,
  onEditChart,
  generatedChartData,
  isEditMode = false,
}: ChartBlockConfigProps) {
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (generatedChartData) {
      const hasIndicators =
        generatedChartData.selectedIndicators &&
        generatedChartData.selectedIndicators.length > 0;

      if (hasIndicators) {
        setIsLoadingPreview(false);
        setShowPreview(true);
      } else {
        setIsLoadingPreview(false);
        setShowPreview(false);
      }
    } else {
      setIsLoadingPreview(false);
      setShowPreview(false);
    }
  }, [generatedChartData]);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="chart-blockName">Block name</Label>
            <Input
              id="chart-blockName"
              value={blockName}
              onChange={(e) => setBlockName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="chart-order">Order</Label>
            <NumberInput
              id="chart-order"
              value={order}
              onChange={setOrder}
              min={0}
              max={999}
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="chart-columns">Columns</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>12 columns in grid system</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <NumberInput
              id="chart-columns"
              value={columns}
              onChange={setColumns}
              min={1}
              max={12}
              placeholder="12"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-2">
            <Label htmlFor="chart-title">Chart title</Label>
            <Input
              id="chart-title"
              value={chartTitle}
              onChange={(e) => setChartTitle(e.target.value)}
              placeholder="Enter chart title..."
            />
          </div>
          {!generatedChartData && (
            <Button
              onClick={onAddChart}
              className="flex items-center gap-2 !h-[40px]"
            >
              <Plus className="h-4 w-4" />
              Add chart
            </Button>
          )}
        </div>

        {/* <div className="space-y-2">
          <Button
            variant="outline"
            onClick={() => {}}
            className="w-fit justify-start"
          >
            <Search className="h-4 w-4 mr-2" />
            Search for data symbols
          </Button>
        </div> */}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Preview chart</Label>

          {generatedChartData && onEditChart && (
            <Button
              onClick={onEditChart}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit Chart
            </Button>
          )}
        </div>
        <div className="rounded-lg min-h-[300px] bg-muted">
          {isLoadingPreview ? (
            <div className="flex items-center justify-center h-full min-h-[250px]">
              <div className="text-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#707FDD]" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">
                    Generating chart preview...
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Processing{" "}
                    {generatedChartData?.selectedIndicators?.length || 0}{" "}
                    {generatedChartData?.selectedIndicators?.length === 1
                      ? "indicator"
                      : "indicators"}
                  </p>
                </div>
                <div className="flex justify-center space-x-1">
                  <div className="w-2 h-2 bg-[#707FDD] rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          ) : showPreview && generatedChartData ? (
            (() => {
              const isCombination =
                generatedChartData.categoryName === "combination";
              const isSingleCategory =
                generatedChartData.categoryName === "macro" ||
                generatedChartData.categoryName === "micro";

              const indicatorNames =
                generatedChartData.selectedIndicators.reduce(
                  (acc, indicator) => {
                    const subData = indicator.subcategoryData as {
                      indicator_name?: string;
                      categoryName?: string;
                      name?: string;
                    };
                    if (subData) {
                      if (subData.indicator_name) {
                        acc[indicator.indicatorId] = subData.indicator_name;
                      } else if (subData.name) {
                        acc[indicator.indicatorId] = subData.name;
                      } else {
                        acc[indicator.indicatorId] = indicator.indicatorId;
                      }
                    } else {
                      acc[indicator.indicatorId] = indicator.indicatorId;
                    }
                    return acc;
                  },
                  {} as Record<string, string>
                );

              const displayTitle = chartTitle || "Chart Preview";

              return (
                <div
                  className="space-y-4"
                  key={`chart-preview-${
                    generatedChartData.selectedIndicators.length
                  }-${generatedChartData.selectedIndicators
                    .map((i) => i.indicatorId)
                    .join("-")}`}
                >
                  <ChartPreview
                    selectedIndicators={generatedChartData.selectedIndicators}
                    customization={generatedChartData.chartCustomization}
                    title={displayTitle}
                    indicatorNames={indicatorNames}
                    showEditMenu={false}
                  />
                </div>
              );
            })()
          ) : (
            <div className="flex items-center justify-center h-full min-h-[250px]">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-lg flex items-center justify-center">
                  <Plus className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Chart preview will appear here
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Click &quot;Add chart&quot; to configure your chart
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
