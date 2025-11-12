"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  LineChart,
  PieChart,
  TrendingUp,
  Download,
  Edit3,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  BarElement,
  BarController,
  LineController,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Chart } from "react-chartjs-2";
import "chartjs-adapter-date-fns";
import { useIndicatorData } from "@/hooks/indicators";
import { ChartDataStructure as ChartDataStructureType } from "@/types";

ChartJS.register(
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  BarElement,
  BarController,
  LineController,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ChartDataStructure {
  labels?: string[];
  datasets?: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }>;
  [key: string]: unknown;
}

interface RealChartPreviewProps {
  chart: ChartDataStructureType;
  onEdit?: (chartId: number) => void;
  onDelete?: (chartId: number) => void;
  onDownload?: (chartId: number) => void;
  className?: string;
}

const getChartIcon = (chartType: string) => {
  switch (chartType) {
    case "line":
      return <LineChart className="h-4 w-4" />;
    case "bar":
      return <BarChart3 className="h-4 w-4" />;
    case "pie":
      return <PieChart className="h-4 w-4" />;
    default:
      return <TrendingUp className="h-4 w-4" />;
  }
};

const getChartTypeColor = (chartType: string) => {
  switch (chartType) {
    case "line":
      return "bg-blue-100 text-blue-800";
    case "bar":
      return "bg-green-100 text-green-800";
    case "pie":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

interface ChartDataset {
  label: string;
  data: Array<{ x: string; y: number }>;
  borderColor: string;
  backgroundColor: string;
  borderWidth: number;
  fill: boolean;
  tension: number;
  pointRadius: number;
  pointHoverRadius: number;
  pointBackgroundColor: string;
  pointBorderColor: string;
  pointBorderWidth: number;
}

interface TransformedChartData {
  labels: string[];
  datasets: ChartDataset[];
}

const transformChartData = (
  chartData: ChartDataStructure,
  selectedIndicators: number[] = []
): TransformedChartData => {
  if (!chartData || typeof chartData !== "object") {
    return { labels: [], datasets: [] };
  }

  const datasets: ChartDataset[] = [];
  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];
  let colorIndex = 0;

  if (selectedIndicators.length === 0) {
    Object.keys(chartData).forEach((key) => {
      const indicator = chartData[key] as Record<string, unknown>;
      if (
        indicator &&
        indicator.data &&
        Array.isArray(indicator.data) &&
        indicator.data.length > 0
      ) {
        datasets.push({
          label: (indicator.indicator_name as string) || key,
          data: indicator.data.map((item: Record<string, unknown>) => ({
            x: item.date as string,
            y: item.value as number,
          })),
          borderColor: colors[colorIndex % colors.length],
          backgroundColor: colors[colorIndex % colors.length] + "20",
          borderWidth: 2,
          fill: false,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 5,
          pointBackgroundColor: colors[colorIndex % colors.length],
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
        });

        colorIndex++;
      }
    });
  } else {
    Object.keys(chartData).forEach((key) => {
      const indicator = chartData[key] as Record<string, unknown>;
      if (
        indicator &&
        indicator.data &&
        Array.isArray(indicator.data) &&
        indicator.data.length > 0
      ) {
        datasets.push({
          label: (indicator.indicator_name as string) || key,
          data: indicator.data.map((item: Record<string, unknown>) => ({
            x: item.date as string,
            y: item.value as number,
          })),
          borderColor: colors[colorIndex % colors.length],
          backgroundColor: colors[colorIndex % colors.length] + "20",
          borderWidth: 2,
          fill: false,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 5,
          pointBackgroundColor: colors[colorIndex % colors.length],
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
        });

        colorIndex++;
      }
    });
  }

  return { labels: [], datasets };
};

export function RealChartPreview({
  chart,
  onEdit,
  onDelete,
  onDownload,
  className = "",
}: RealChartPreviewProps) {
  const position = (chart.chartConfig?.position as string) || "inline";

  const {
    indicatorData,
    fetchIndicatorData,
    isLoading: isLoadingData,
  } = useIndicatorData();

  useEffect(() => {
    if (
      chart.chartSelection?.selectedIndicators &&
      chart.chartSelection.selectedIndicators.length > 0
    ) {
      const categoryIdMap: Record<string, number> = {
        Macro: 1,
        Micro: 2,
        Options: 3,
        CTA: 4,
        Combination: 5,
        Exclusive: 6,
      };

      const categoryId = categoryIdMap[chart.chartSelection.categoryName] || 1;

      // Extract indicator IDs from the detailed structure
      const indicatorIds = chart.chartSelection.selectedIndicators.map(
        (indicator) => indicator.id
      );

      fetchIndicatorData(indicatorIds, categoryId);
    }
  }, [
    chart.chartSelection?.selectedIndicators,
    chart.chartSelection?.categoryName,
    fetchIndicatorData,
  ]);

  const dataToTransform = indicatorData || chart.chartData;
  const selectedIndicators =
    chart.chartSelection?.selectedIndicators?.map(
      (indicator) => indicator.id
    ) || [];

  const transformedData = transformChartData(
    dataToTransform,
    selectedIndicators
  );
  const hasData = transformedData.datasets.length > 0;

  let chartType = "line";
  if (chart.chartConfiguration?.config) {
    try {
      const config = JSON.parse(chart.chartConfiguration.config);
      chartType = config.chartType || "line";
    } catch (error) {
      console.error("Error parsing chart config:", error);
      chartType = "line";
    }
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    aspectRatio: 2,
    plugins: {
      title: {
        display: true,
        text: chart.title || "Generated Chart",
        font: {
          size: 14,
          weight: "bold" as const,
        },
        color: "hsl(var(--foreground))",
      },
      legend: {
        display: true,
        position: "top" as const,
        labels: {
          usePointStyle: true,
          pointStyle: "circle",
          font: {
            size: 12,
          },
          color: "hsl(var(--foreground))",
        },
      },
      tooltip: {
        enabled: true,
        mode: "index" as const,
        intersect: false,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "#fff",
        bodyColor: "#fff",
        borderColor: "#e5e7eb",
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        type: "time" as const,
        time: {
          unit: "month" as const,
          tooltipFormat: "MMM d, yyyy",
          displayFormats: {
            month: "MMM yyyy",
            year: "yyyy",
          },
        },
        display: true,
        title: {
          display: true,
          text: "Date",
          font: {
            size: 12,
            weight: "bold" as const,
          },
          color: "hsl(var(--foreground))",
        },
        grid: {
          display: true,
          color: "#f3f4f6",
        },
        ticks: {
          color: "#6b7280",
          font: {
            size: 11,
          },
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: "Value",
          font: {
            size: 12,
            weight: "bold" as const,
          },
          color: "hsl(var(--foreground))",
        },
        grid: {
          display: true,
          color: "#f3f4f6",
        },
        ticks: {
          color: "#6b7280",
          font: {
            size: 11,
          },
        },
      },
    },
    interaction: {
      intersect: false,
      mode: "index" as const,
    },
  };

  return (
    <Card className={`bg-white shadow-sm ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getChartIcon(chartType)}
            <CardTitle className="text-sm font-medium text-gray-700">
              {chart.title || "Generated Chart"}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className={`text-xs ${getChartTypeColor(chartType)}`}
            >
              {chartType.charAt(0).toUpperCase() + chartType.slice(1)}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(chart.id)}>
                    <Edit3 className="h-3 w-3 mr-2" />
                    Edit Chart
                  </DropdownMenuItem>
                )}
                {onDownload && (
                  <DropdownMenuItem onClick={() => onDownload(chart.id)}>
                    <Download className="h-3 w-3 mr-2" />
                    Download
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    onClick={() => onDelete(chart.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-3 w-3 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="bg-white rounded-lg border border-gray-200 p-4 min-h-[300px] w-full">
            {chart.chartImagePath ? (
              <Image
                src={chart.chartImagePath}
                alt="Chart Preview"
                width={400}
                height={250}
                className="w-full h-full object-contain"
              />
            ) : isLoadingData ? (
              <div className="flex items-center justify-center h-[250px] text-center text-gray-500">
                <div>
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50 animate-pulse" />
                  <p className="text-sm">Loading chart data...</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Fetching indicator values
                  </p>
                </div>
              </div>
            ) : hasData ? (
              <div className="w-full h-[250px]">
                <Chart
                  type={
                    chartType === "area"
                      ? "line"
                      : (chartType as "line" | "bar" | "pie")
                  }
                  data={transformedData}
                  options={chartOptions}
                  className="w-full h-full"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-center text-gray-500">
                <div>
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Chart preview will be generated</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Position: {position}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
