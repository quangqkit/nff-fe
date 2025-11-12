"use client";

import { useMemo } from "react";
import { generateChartPreviewData } from "@/utils/chart-data-generator";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { useTheme } from "@/hooks/core/useTheme";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  BarController,
  LineController,
  ScatterController,
  BubbleController,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
} from "chart.js";
import { Chart } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  BarController,
  LineController,
  ScatterController,
  BubbleController,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
);

import type { SelectedIndicator, ChartCustomization } from "@/types/charts";

interface ChartPreviewProps {
  selectedIndicators: SelectedIndicator[];
  customization: ChartCustomization;
  title?: string;
  className?: string;
  indicatorNames?: Record<string, string>;
  onEditChart?: () => void;
  showEditMenu?: boolean;
}

export function ChartPreview({
  selectedIndicators,
  customization,
  title,
  className,
  indicatorNames = {},
  onEditChart,
  showEditMenu = false,
}: ChartPreviewProps) {
  const { isDark } = useTheme();

  const previewData = useMemo(() => {
    return generateChartPreviewData(
      selectedIndicators,
      customization,
      title,
      indicatorNames,
      isDark
    );
  }, [selectedIndicators, customization, title, indicatorNames, isDark]);

  const { chartData, chartOptions } = previewData;

  const chartTypes = selectedIndicators.map((ind) => ind.chartType);
  const hasMixedTypes = new Set(chartTypes).size > 1;

  const baseChartType = hasMixedTypes
    ? "line"
    : selectedIndicators[0]?.chartType === "area"
    ? "line"
    : selectedIndicators[0]?.chartType === "pie"
    ? "doughnut"
    : selectedIndicators[0]?.chartType || "line";

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardContent className="p-2 space-y-2 flex flex-col h-full">
        {title && (
          <div className="flex items-center justify-center mb-0 flex-shrink-0">
            <h3 className="font-semibold text-foreground">{title}</h3>
          </div>
        )}
        <div
          className="relative flex-1 w-full -m-2"
          style={{ height: "350px" }}
        >
          {chartData.datasets.length > 0 ? (
            <Chart
              type={baseChartType}
              data={chartData}
              options={{
                ...chartOptions,
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                  padding: 0,
                },
                plugins: {
                  ...chartOptions.plugins,
                  legend: {
                    ...chartOptions.plugins?.legend,
                    display: true,
                    position: "bottom" as const,
                  },
                },
              }}
              className="w-full h-full max-w-full"
              style={{
                width: "100%",
                height: "320px",
                maxHeight: "320px",
                minHeight: "300px",
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-muted rounded-lg">
              <div className="text-center">
                <div className="text-4xl mb-2">📊</div>
                <p className="text-muted-foreground">No data to display</p>
                <p className="text-sm text-muted-foreground">
                  Select indicators to see preview
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
