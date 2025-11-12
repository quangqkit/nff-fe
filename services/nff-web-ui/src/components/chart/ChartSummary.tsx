"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type {
  SelectedIndicator,
  ChartPosition,
  ChartCustomization,
  ChartCategory,
} from "@/types/charts";
import { generateChartSummaryData } from "@/utils/chart-data-generator";
import { cn } from "@/lib/utils";

interface ChartSummaryProps {
  selectedCategory: ChartCategory;
  selectedIndicators: SelectedIndicator[];
  position: ChartPosition;
  customization: ChartCustomization;
  title?: string;
  className?: string;
  indicatorNames?: Record<string, string>;
}

export function ChartSummary({
  selectedCategory,
  selectedIndicators,
  position,
  customization,
  title,
  className,
  indicatorNames = {},
}: ChartSummaryProps) {
  const summaryData = useMemo(() => {
    return generateChartSummaryData(
      selectedCategory,
      selectedIndicators,
      position,
      customization,
      title
    );
  }, [selectedCategory, selectedIndicators, position, customization, title]);

  return (
    <div className={cn("h-full", className)}>
      <Card className="flex flex-col h-full">
        <CardContent className="p-4 space-y-4 flex flex-col h-full">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{selectedCategory.icon}</div>
            <div>
              <div className="font-medium text-foreground">
                {selectedCategory.title}
              </div>
            </div>
          </div>

          <div className="space-y-3 flex-1">
            <div className="text-sm font-medium text-muted-foreground">
              Selected Indicators ({selectedIndicators.length})
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {selectedIndicators.map((indicator, index) => {
                const indicatorName =
                  indicatorNames[indicator.indicatorId] ||
                  indicator.indicatorId;

                const getChartTypeBadge = (chartType: string) => {
                  const styles = {
                    line: "bg-blue-500/10 text-blue-600 border-blue-200 dark:text-blue-400 dark:border-blue-800",
                    bar: "bg-green-500/10 text-green-600 border-green-200 dark:text-green-400 dark:border-green-800",
                    area: "bg-purple-500/10 text-purple-600 border-purple-200 dark:text-purple-400 dark:border-purple-800",
                    pie: "bg-pink-500/10 text-pink-600 border-pink-200 dark:text-pink-400 dark:border-pink-800",
                    scatter:
                      "bg-orange-500/10 text-orange-600 border-orange-200 dark:text-orange-400 dark:border-orange-800",
                  };
                  return (
                    styles[chartType as keyof typeof styles] ||
                    "bg-muted text-muted-foreground border-border"
                  );
                };

                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-muted rounded-md hover:bg-muted/80 transition-colors"
                  >
                    <span className="font-medium text-foreground text-xs truncate flex-1 mr-2">
                      {indicatorName}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-xs font-medium shrink-0 ${getChartTypeBadge(
                        indicator.chartType
                      )}`}
                    >
                      {indicator.chartType.charAt(0).toUpperCase() +
                        indicator.chartType.slice(1)}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-medium text-muted-foreground">
              Configuration
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col p-2 bg-muted rounded-md">
                <span className="text-xs text-muted-foreground">Position</span>
                <span className="text-sm font-medium capitalize">
                  {position}
                </span>
              </div>
              <div className="flex flex-col p-2 bg-muted rounded-md">
                <span className="text-xs text-muted-foreground">Theme</span>
                <span className="text-sm font-medium capitalize">
                  {customization.theme.mode}
                </span>
              </div>
              <div className="flex flex-col p-2 bg-muted rounded-md">
                <span className="text-xs text-muted-foreground">Font Size</span>
                <span className="text-sm font-medium">
                  {customization.typography.fontSize}px
                </span>
              </div>
              <div className="flex flex-col p-2 bg-muted rounded-md">
                <span className="text-xs text-muted-foreground">Icon</span>
                <span className="text-sm font-medium">
                  {customization.icons.iconStyle || "outline"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
