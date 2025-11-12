import {
  ChartDataset,
  ChartDataPoint,
  ChartOptions,
  ChartPreviewData,
  ChartSummaryData,
  SelectedIndicator,
  ChartCategory,
  ChartPosition,
  ChartCustomization,
} from "@/types/charts";

const generateIndicatorData = (
  indicator: SelectedIndicator,
  dateRange: { start: Date; end: Date }
): ChartDataPoint[] => {
  const { start, end } = dateRange;
  const daysDiff = Math.ceil(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );
  const dataPoints: ChartDataPoint[] = [];

  let baseValue = 100;
  let trend = 0.02;
  let volatility = 0.1;

  switch (indicator.indicatorId) {
    case "cpi":
      baseValue = 250;
      trend = 0.03;
      volatility = 0.05;
      break;
    case "gdp":
      baseValue = 20000;
      trend = 0.025;
      volatility = 0.08;
      break;
    case "vix":
      baseValue = 20;
      trend = -0.01;
      volatility = 0.3;
      break;
    case "initial-job-claims":
      baseValue = 200;
      trend = -0.005;
      volatility = 0.15;
      break;
    case "T10YIE":
      baseValue = 2.5;
      trend = 0.001;
      volatility = 0.2;
      break;
    case "DFII10":
      baseValue = 1.8;
      trend = 0.0005;
      volatility = 0.15;
      break;
    case "T10Y2Y":
      baseValue = 1.2;
      trend = 0.0002;
      volatility = 0.25;
      break;
    case "T2Y":
      baseValue = 4.5;
      trend = 0.002;
      volatility = 0.3;
      break;
    case "MORTGAGE30US":
      baseValue = 6.8;
      trend = 0.001;
      volatility = 0.2;
      break;
    default:
      baseValue = 100;
      trend = 0.02;
      volatility = 0.1;
  }

  const monthsDiff = Math.ceil(daysDiff / 30);
  for (let i = 0; i < monthsDiff; i++) {
    const date = new Date(start.getTime() + i * 30 * 24 * 60 * 60 * 1000);
    const randomFactor = (Math.random() - 0.5) * 2 * volatility;
    const trendFactor = (i * trend) / 12;
    const value = baseValue * (1 + trendFactor + randomFactor);

    dataPoints.push({
      x: date,
      y: Math.round(value * 100) / 100,
      label: date.toISOString().split("T")[0],
      metadata: {
        indicator: indicator.indicatorId,
        source: "mock-data",
        quality: "high",
      },
    });
  }

  return dataPoints;
};

const generateChartDatasets = (
  selectedIndicators: SelectedIndicator[],
  dateRange: { start: Date; end: Date },
  indicatorNames: Record<string, string> = {},
  isDarkMode: boolean = false
): ChartDataset[] => {
  const colors = isDarkMode
    ? [
        "#60a5fa",
        "#34d399",
        "#fbbf24",
        "#f87171",
        "#a78bfa",
        "#22d3ee",
        "#a3e635",
        "#fb923c",
        "#f472b6",
        "#818cf8",
      ]
    : [
        "#3b82f6",
        "#10b981",
        "#f59e0b",
        "#ef4444",
        "#8b5cf6",
        "#06b6d4",
        "#84cc16",
        "#f97316",
        "#ec4899",
        "#6366f1",
      ];

  return selectedIndicators.map((indicator, index) => {
    let data: ChartDataPoint[];

    if (
      indicator.subcategoryData &&
      (indicator.subcategoryData as any).data_points
    ) {
      const dataPoints = (indicator.subcategoryData as any).data_points;
      data = dataPoints.map((point: any) => ({
        x: new Date(point.date),
        y: point.value,
        label: point.date,
        metadata: {
          indicator: indicator.indicatorId,
          source: "api-data",
          quality: "high",
        },
      }));
    } else {
      data = generateIndicatorData(indicator, dateRange);
    }

    const color = colors[index % colors.length];

    let backgroundColor;
    if (indicator.chartType === "line") {
      backgroundColor = "transparent";
    } else if (indicator.chartType === "area") {
      backgroundColor = color + "40";
    } else {
      backgroundColor = color + "80";
    }

    return {
      label:
        indicatorNames[indicator.indicatorId] ||
        (indicator.subcategoryData as any)?.indicator_name ||
        indicator.indicatorId?.toUpperCase() ||
        "Unknown Indicator",
      data,
      backgroundColor,
      borderColor: color,
      fill: indicator.chartType === "area" ? true : false,
      tension:
        indicator.chartType === "line" || indicator.chartType === "area"
          ? 0.4
          : 0,
      pointRadius:
        indicator.chartType === "line" || indicator.chartType === "area"
          ? 3
          : 0,
      pointHoverRadius: 5,
      pointBackgroundColor: color,
      pointBorderColor: "#ffffff",
      pointBorderWidth: 2,
      type:
        indicator.chartType === "area"
          ? "line"
          : indicator.chartType === "pie"
          ? "bar"
          : indicator.chartType,
      order:
        indicator.chartType === "line"
          ? 1
          : indicator.chartType === "bar"
          ? 2
          : 0,
      hidden: false,
      barPercentage: indicator.chartType === "bar" ? 0.6 : undefined,
      categoryPercentage: indicator.chartType === "bar" ? 0.8 : undefined,
      borderWidth:
        indicator.chartType === "line"
          ? 3
          : indicator.chartType === "area"
          ? 2
          : 1,
    };
  });
};

const generateChartOptions = (
  customization: ChartCustomization,
  isDarkMode: boolean = false
): ChartOptions => {
  return {
    responsive: true,
    maintainAspectRatio: false,
    aspectRatio:
      customization.size?.aspectRatio === "auto"
        ? undefined
        : customization.size?.aspectRatio === "square"
        ? 1
        : customization.size?.aspectRatio === "wide"
        ? 16 / 9
        : 9 / 16,
    plugins: {
      title: {
        display: false,
        text: "",
        font: {
          size: customization.typography?.titleSize || 16,
          family: customization.typography?.fontFamily || "Arial",
          weight:
            (customization.typography?.fontWeight as
              | "normal"
              | "bold"
              | "lighter"
              | "bolder"
              | number) || "normal",
        },
        color:
          customization.colors?.text || (isDarkMode ? "#E5E7EB" : "#1F2937"),
      },
      legend: {
        display: customization.icons?.showLegend || true,
        position: "top",
        labels: {
          usePointStyle: true,
          pointStyle: "circle",
          color:
            customization.colors?.text || (isDarkMode ? "#E5E7EB" : "#1F2937"),
          font: {
            size: customization.typography?.labelSize || 12,
            family: customization.typography?.fontFamily || "Arial",
            weight:
              (customization.typography?.fontWeight as
                | "normal"
                | "bold"
                | "lighter"
                | "bolder"
                | number) || "normal",
          },
        },
      },
      tooltip: {
        enabled: true,
        mode: "index",
        intersect: false,
        backgroundColor:
          customization.colors?.background ||
          (isDarkMode ? "#374151" : "hsl(var(--popover))"),
        titleColor:
          customization.colors?.text || (isDarkMode ? "#E5E7EB" : "#1F2937"),
        bodyColor:
          customization.colors?.text || (isDarkMode ? "#E5E7EB" : "#1F2937"),
        borderColor:
          customization.colors?.grid ||
          (isDarkMode ? "#4B5563" : "hsl(var(--border))"),
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: "Date",
          color:
            customization.colors?.text || (isDarkMode ? "#E5E7EB" : "#1F2937"),
          font: {
            size: customization.typography?.labelSize || 12,
            family: customization.typography?.fontFamily || "Arial",
            weight: "normal",
          },
        },
        grid: {
          display: customization.icons?.showGrid || true,
          color:
            customization.colors?.grid ||
            (isDarkMode ? "#4B5563" : "hsl(var(--border))"),
          drawBorder: true,
          drawOnChartArea: true,
          drawTicks: true,
        },
        ticks: {
          color:
            customization.colors?.text || (isDarkMode ? "#E5E7EB" : "#1F2937"),
          font: {
            size: customization.typography?.labelSize || 12,
            family: customization.typography?.fontFamily || "Arial",
            weight: "normal",
          },
          ...({
            maxRotation: 0,
            minRotation: 0,
            padding: 8,
            maxTicksLimit: 6,
            autoSkip: true,
            autoSkipPadding: 15,
            callback: function (value: string | number) {
              if (typeof value === "number") {
                return (2000 + value * 2).toString();
              }
              return value;
            },
          } as Record<string, unknown>),
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: "Value",
          color:
            customization.colors?.text || (isDarkMode ? "#E5E7EB" : "#1F2937"),
          font: {
            size: customization.typography?.labelSize || 12,
            family: customization.typography?.fontFamily || "Arial",
            weight:
              (customization.typography?.fontWeight as
                | "normal"
                | "bold"
                | "lighter"
                | "bolder"
                | number) || "normal",
          },
        },
        grid: {
          display: customization.icons?.showGrid || true,
          color:
            customization.colors?.grid ||
            (isDarkMode ? "#4B5563" : "hsl(var(--border))"),
          drawBorder: true,
          drawOnChartArea: true,
          drawTicks: true,
        },
        ticks: {
          color:
            customization.colors?.text || (isDarkMode ? "#E5E7EB" : "#1F2937"),
          font: {
            size: customization.typography?.fontSize || 12,
            family: customization.typography?.fontFamily || "Arial",
            weight:
              (customization.typography?.fontWeight as
                | "normal"
                | "bold"
                | "lighter"
                | "bolder"
                | number) || "normal",
          },
        },
      },
    },
    interaction: {
      intersect: false,
      mode: "index",
    },
    animation: {
      duration: 1000,
      easing: "easeInOutQuad",
    },
  };
};

export const generateChartPreviewData = (
  selectedIndicators: SelectedIndicator[],
  customization: ChartCustomization,
  title?: string,
  indicatorNames: Record<string, string> = {},
  isDarkMode: boolean = false
): ChartPreviewData => {
  if (selectedIndicators.length === 0) {
    return {
      hasData: false,
      indicatorCount: 0,
      categoryName: "",
      chartType: "line",
      position: "inline",
      title: title || "",
      chartData: {
        id: 0,
        title: title || "",
        labels: [],
        datasets: [],
      },
      chartOptions: generateChartOptions(customization, isDarkMode),
    };
  }

  let startDate = new Date("2000-01-01");
  let endDate = new Date();

  selectedIndicators.forEach((indicator) => {
    if (indicator.dateRange) {
      if (indicator.dateRange.customStart) {
        const customStart = new Date(indicator.dateRange.customStart);
        if (customStart < startDate) {
          startDate = customStart;
        }
      }
      if (indicator.dateRange.customEnd) {
        const customEnd = new Date(indicator.dateRange.customEnd);
        if (customEnd > endDate) {
          endDate = customEnd;
        }
      }
    }
  });

  const datasets = generateChartDatasets(
    selectedIndicators,
    {
      start: startDate,
      end: endDate,
    },
    indicatorNames,
    isDarkMode
  );

  const labels: string[] = [];
  const daysDiff = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const step = Math.max(1, Math.floor(daysDiff / 12));

  for (let i = 0; i < daysDiff; i += step) {
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    labels.push(date.toISOString().split("T")[0]);
  }

  return {
    hasData: selectedIndicators.length > 0,
    indicatorCount: selectedIndicators.length,
    categoryName: "",
    chartType: selectedIndicators[0]?.chartType || "line",
    position: "inline",
    title: title || "",
    chartData: {
      id: Date.now(),
      title: title || "",
      labels,
      datasets,
    },
    chartOptions: generateChartOptions(customization, isDarkMode),
  };
};

export const generateChartSummaryData = (
  selectedCategory: ChartCategory,
  selectedIndicators: SelectedIndicator[],
  position: ChartPosition,
  customization: ChartCustomization,
  title?: string
): ChartSummaryData => {
  return {
    hasData: selectedIndicators.length > 0,
    indicatorCount: selectedIndicators.length,
    categoryName: selectedCategory.title,
    chartType: selectedIndicators[0]?.chartType || "line",
    position: position,
    title: title || "",
    chartData: {
      id: Date.now(),
      title: title || "",
      labels: [],
      datasets: [],
    },
    chartOptions: generateChartOptions(customization),
  };
};
