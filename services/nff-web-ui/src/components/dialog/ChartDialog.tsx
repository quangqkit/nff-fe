"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DEFAULT_CHART_CUSTOMIZATION,
  getDefaultChartPosition,
} from "@/constants/chart-config";
import { MAIN_COLOR, MAIN_COLOR_HOVER } from "@/constants/colors";
import { useUpdateChart } from "@/hooks/api";
import { useChartConfig, useGenerateChart } from "@/hooks/charts";
import { useToast } from "@/hooks/core";
import { useIndicators } from "@/hooks/indicators";
import { useInfiniteScroll } from "@/hooks/ui";
import { cn } from "@/lib/utils";
import {
  ChartCategory,
  ChartCustomization,
  ChartDialogProps,
  ChartPosition,
  SelectedIndicator,
} from "@/types";
import {
  ArrowDownAZ,
  BarChart3,
  Calendar,
  LineChart,
  Loader2,
  Search,
  TrendingUp,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DateRange } from "react-day-picker";
import { ChartPreview } from "../chart/ChartPreview";
import { ChartSummary } from "../chart/ChartSummary";
import { ChartConfigStep } from "./ChartConfigStep";
import { IndicatorTable } from "./IndicatorTable";

const HARDCODED_CATEGORIES: ChartCategory[] = [
  {
    id: "macro",
    title: "Macro",
    description: "Economic indicators and market trends",
    icon: "🌍",
  },
  {
    id: "micro",
    title: "Micro",
    description: "Individual stock and company analysis",
    icon: "🏢",
  },
  {
    id: "options",
    title: "Options",
    description: "Options trading analysis and derivatives data",
    icon: "📈",
  },
  {
    id: "cta",
    title: "CTA",
    description: "Commodity Trading Advisor strategies",
    icon: "📢",
  },
  {
    id: "combination",
    title: "Combination",
    description: "Multiple category combinations",
    icon: "🔗",
  },
  {
    id: "exclusive",
    title: "Exclusive",
    description: "Exclusive category for special analysis",
    icon: "⭐",
  },
];

const CATEGORY_ID_MAP: Record<string, number> = {
  macro: 1,
  micro: 2,
  options: 3,
  cta: 4,
  combination: 5,
  exclusive: 6,
};

export function ChartDialog({
  isOpen,
  onClose,
  title,
  steps: initialSteps,
  currentStep,
  onStepChange,
  reportTypeId,
  editingChart,
  isEditMode = false,
  initialTitle,
  onChartGenerated,
}: ChartDialogProps) {
  const [localReportTypeId, setLocalReportTypeId] = useState<
    number | undefined
  >(reportTypeId);

  useEffect(() => {
    if (reportTypeId !== undefined) {
      setLocalReportTypeId(reportTypeId);
    }
  }, [reportTypeId]);

  const {
    indicators,
    isLoading: isLoadingIndicators,
    error,
    pagination,
    fetchIndicators,
    fetchMoreIndicators,
    fetchCombinedIndicators,
    filterIndicatorsByDateRange,
    filterIndicatorByDateRange,
  } = useIndicators();

  const { sentinelRef } = useInfiniteScroll({
    onLoadMore: fetchMoreIndicators,
    hasMore: pagination?.hasMore || false,
    isLoading: isLoadingIndicators,
    rootMargin: "200px",
  });
  const [selectedCategory, setSelectedCategory] =
    useState<ChartCategory | null>(null);
  const [selectedIndicators, setSelectedIndicators] = useState<
    SelectedIndicator[]
  >([]);
  const [chartPosition, setChartPosition] = useState<ChartPosition>(
    getDefaultChartPosition()
  );
  const [chartId, setChartId] = useState<number | undefined>(undefined);
  const [chartCustomization, setChartCustomization] =
    useState<ChartCustomization>(DEFAULT_CHART_CUSTOMIZATION);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const [combinationChartType, setCombinationChartType] = useState<
    "line" | "bar" | "area"
  >("bar");
  const [combinationDateRange, setCombinationDateRange] = useState<DateRange>({
    from: new Date("2000-01-01"),
    to: new Date(),
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "date">("name");

  const steps = useMemo(() => {
    if (selectedCategory?.id === "combination") {
      return [
        { id: "select-category", title: "Select category" },
        { id: "select-indicators", title: "Indicators" },
        { id: "date-chart-type", title: "Date & chart type" },
        { id: "chart-config", title: "Chart config" },
        { id: "preview", title: "Preview" },
      ];
    }
    return initialSteps;
  }, [selectedCategory, initialSteps]);

  const { updateChartConfig } = useChartConfig();
  const { isLoading: isGeneratingChart } = useGenerateChart();
  const { isPending: isUpdatingChart } = useUpdateChart();
  const { showToast } = useToast();

  const handleConfigChange = useCallback(
    (config: { position: string; customConfig: string }) => {
      setChartPosition(config.position as ChartPosition);
      setChartCustomization(JSON.parse(config.customConfig));
    },
    []
  );

  useEffect(() => {
    if (isOpen && isEditMode && editingChart) {
      setChartId(editingChart.id);

      const content = (editingChart as { content?: any })?.content || {};
      const categoryName =
        content.categoryName || editingChart.chartSelection?.categoryName || "";

      const category = HARDCODED_CATEGORIES.find(
        (cat) => cat.id === categoryName?.toLowerCase()
      );
      if (category) {
        setSelectedCategory(category);
        setCompletedSteps([0]);
      }

      const selectedIndicatorsData =
        content.selectedIndicators ||
        editingChart.chartSelection?.selectedIndicators ||
        [];

      if (
        selectedIndicatorsData &&
        Array.isArray(selectedIndicatorsData) &&
        selectedIndicatorsData.length > 0
      ) {
        type SavedIndicator = {
          indicatorId?: string;
          id?: number;
          chartType: string;
          dateRange: {
            preset: string;
            customStart?: Date;
            customEnd?: Date;
          };
          value?: number;
          subcategoryData?: {
            name: string;
            id: number;
            indicators: string[];
            values: number[];
          };
        };

        const selectedIndicatorsParsed = (
          selectedIndicatorsData as SavedIndicator[]
        )
          .filter(
            (indicator: SavedIndicator) =>
              indicator &&
              (indicator.indicatorId != null || indicator.id != null)
          )
          .map((indicator: SavedIndicator) => ({
            indicatorId:
              indicator.indicatorId || indicator.id?.toString() || "0",
            chartType: indicator.chartType as "line" | "bar" | "area" | "pie",
            dateRange: {
              preset: (indicator.dateRange?.preset || "5Y") as
                | "1Y"
                | "2Y"
                | "5Y"
                | "10Y"
                | "MAX"
                | "CUSTOM",
              customStart: indicator.dateRange?.customStart
                ? typeof indicator.dateRange.customStart === "string"
                  ? new Date(indicator.dateRange.customStart)
                  : indicator.dateRange.customStart
                : undefined,
              customEnd: indicator.dateRange?.customEnd
                ? typeof indicator.dateRange.customEnd === "string"
                  ? new Date(indicator.dateRange.customEnd)
                  : indicator.dateRange.customEnd
                : undefined,
            },
            isSelected: true,
            value: indicator.value,
            subcategoryData: indicator.subcategoryData,
          }));
        setSelectedIndicators(selectedIndicatorsParsed);
        if (selectedIndicatorsParsed.length > 0) {
          setCompletedSteps((prev) => {
            const newSteps = prev.includes(0) ? prev : [...prev, 0];
            return newSteps.includes(1) ? newSteps : [...newSteps, 1];
          });
        }
      }

      const chartConfig = content.chartConfig || editingChart.chartConfig || {};

      if (chartConfig.position) {
        setChartPosition(chartConfig.position as ChartPosition);
      }

      const chartCustomizationData =
        content.chartCustomization ||
        editingChart.chartConfiguration?.config ||
        null;

      if (chartCustomizationData) {
        try {
          const config =
            typeof chartCustomizationData === "string"
              ? JSON.parse(chartCustomizationData)
              : chartCustomizationData;
          setChartCustomization(config);
        } catch (error) {
          console.error("Error parsing chart config:", error);
        }
      }

      if (content.chartPosition) {
        setChartPosition(content.chartPosition as ChartPosition);
      }

      if (
        (chartConfig.position || content.chartPosition) &&
        chartCustomizationData
      ) {
        setCompletedSteps((prev) => {
          const newSteps = prev.includes(0) ? prev : [...prev, 0];
          const withStep1 = newSteps.includes(1) ? newSteps : [...newSteps, 1];
          return withStep1.includes(2) ? withStep1 : [...withStep1, 2];
        });
      }
    } else {
      setChartId(undefined);
      resetDialogState();
    }
  }, [isOpen, isEditMode, editingChart?.id]);

  useEffect(() => {
    if (!isOpen) {
      resetDialogState();
    }
  }, [isOpen]);

  useEffect(() => {
    if (currentStep === 1 && selectedCategory) {
      if (selectedCategory.id === "combination") {
        fetchCombinedIndicators();
      } else {
        const numericCategoryId = CATEGORY_ID_MAP[selectedCategory.id];
        if (numericCategoryId) {
          const effectiveReportTypeId = reportTypeId || localReportTypeId;
          fetchIndicators(numericCategoryId, {
            reportTypeId: effectiveReportTypeId,
          });
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, selectedCategory, isEditMode]);

  const resetDialogState = () => {
    setSelectedCategory(null);
    setSelectedIndicators([]);
    setChartPosition(getDefaultChartPosition());
    setChartCustomization(DEFAULT_CHART_CUSTOMIZATION);
    setCompletedSteps([]);
    setChartId(undefined);
  };

  const handleCategorySelect = (category: ChartCategory) => {
    setSelectedCategory(category);
    setCompletedSteps((prev) => (prev.includes(0) ? prev : [...prev, 0]));

    if ("vibrate" in navigator) {
      navigator.vibrate(50);
    }
  };

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps([...completedSteps, currentStep]);
      }

      if (currentStep === 2 && selectedCategory?.id === "combination") {
        const updatedIndicators = selectedIndicators.map((indicator) => ({
          ...indicator,
          chartType: combinationChartType,
          dateRange: {
            preset: "CUSTOM" as const,
            customStart: combinationDateRange.from,
            customEnd: combinationDateRange.to,
          },
        }));
        setSelectedIndicators(updatedIndicators);
      }

      if (
        (currentStep === 2 || currentStep === 3) &&
        chartId &&
        chartId > 0 &&
        isEditMode &&
        editingChart?.id
      ) {
        try {
          await updateChartConfig(editingChart.id, {
            position: chartPosition,
            config: JSON.stringify(chartCustomization),
          });
        } catch (error) {
          console.error("Failed to save chart config:", error);
        }
      }

      onStepChange?.(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    if (selectedCategory && selectedIndicators.length > 0) {
      try {
        const categoryId = CATEGORY_ID_MAP[selectedCategory.id];
        if (categoryId) {
          const cleanCustomization = JSON.parse(
            JSON.stringify(chartCustomization)
          );

          const indicatorNames = (() => {
            const namesFromIndicators = indicators.reduce((acc, indicator) => {
              if ("indicator_id" in indicator) {
                const combinedIndicator = indicator as {
                  indicator_id: string;
                  indicator_name: string;
                  categoryName?: string;
                };
                acc[indicator.indicator_id] = indicator.indicator_name;
              } else if (indicator.id) {
                acc[indicator.id?.toString()] = indicator.name;
              }
              return acc;
            }, {} as Record<string, string>);

            const namesFromSelected = selectedIndicators.reduce(
              (acc, selected) => {
                const subData = selected.subcategoryData as any;
                if (subData?.indicator_name) {
                  acc[selected.indicatorId] = subData.indicator_name;
                } else if (subData?.name) {
                  acc[selected.indicatorId] = subData.name;
                } else if (!namesFromIndicators[selected.indicatorId]) {
                  acc[selected.indicatorId] = selected.indicatorId;
                }
                return acc;
              },
              {} as Record<string, string>
            );

            return { ...namesFromIndicators, ...namesFromSelected };
          })();

          let chartType: string = "line";
          if (selectedCategory.id === "combination") {
            chartType = combinationChartType;
          } else if (selectedIndicators.length > 0) {
            chartType = selectedIndicators[0].chartType;
          }

          const chartData = {
            id: isEditMode && editingChart?.id ? editingChart.id : Date.now(),
            title: initialTitle || "New Chart",
            categoryId: categoryId,
            categoryName: selectedCategory.id,
            selectedIndicators: selectedIndicators,
            chartConfig: {
              type: chartType,
              title: initialTitle || "New Chart",
              position: chartPosition,
              ...cleanCustomization,
            },
            chartCustomization: cleanCustomization,
            chartPosition: chartPosition,
            indicatorNames: indicatorNames,
            orderIndex: 0,
            generatedAt: new Date(),
            status: "generated" as const,
          };

          onChartGenerated?.(chartData as unknown as any);

          showToast?.({
            type: "success",
            title: "Chart Configured Successfully!",
            description: "Chart data has been prepared for block creation.",
            duration: 3000,
          });

          resetDialogState();
          onClose?.();
          return;
        }
      } catch (error) {
        console.error("Failed to configure chart:", error);
        showToast?.({
          type: "error",
          title: "Configuration Failed",
          description: "Unable to configure chart. Please try again.",
          duration: 5000,
        });
        return;
      }
    }

    resetDialogState();
    onClose?.();
  };

  const handleBack = () => {
    if (currentStep > 0) {
      onStepChange?.(currentStep - 1);
    }
  };

  const updatedSteps = steps.map((step, index) => ({
    ...step,
    isActive: index === currentStep,
    isCompleted: completedSteps.includes(index),
  }));

  // Search Controls Component
  const renderSearchControls = () => (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search indicators by name..."
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSearchTerm(e.target.value)
          }
          className="pl-9 pr-9 h-10 text-sm"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchTerm("")}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 rounded-full border border-input hover:bg-muted"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Select
          value={sortBy}
          onValueChange={(value: "name" | "date") => setSortBy(value)}
        >
          <SelectTrigger className="w-[140px] h-10 text-sm">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">
              <div className="flex items-center gap-2">
                <ArrowDownAZ className="h-4 w-4" />
                <span>Name</span>
              </div>
            </SelectItem>
            <SelectItem value="date">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Date</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">SELECT CATEGORIES</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                {HARDCODED_CATEGORIES.map((category) => (
                  <Card
                    key={category.id}
                    className={cn(
                      "cursor-pointer transition-all duration-200 hover:shadow-md",
                      selectedCategory && selectedCategory.id === category.id
                        ? "ring-2 ring-[#707FDD] bg-[#707FDD]/5"
                        : "hover:bg-muted/50"
                    )}
                    onClick={() => handleCategorySelect(category)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className="text-2xl">{category.icon}</div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm mb-1">
                            {category.title}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {category.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-6">
            <div>
              {error ? (
                <div className="text-center py-8">
                  <p className="text-red-600 mb-4">Failed to load indicators</p>
                  <Button
                    onClick={() => {
                      if (selectedCategory) {
                        if (selectedCategory.id === "combination") {
                          fetchCombinedIndicators();
                        } else {
                          const numericCategoryId =
                            CATEGORY_ID_MAP[selectedCategory.id];
                          if (numericCategoryId) {
                            const effectiveReportTypeId =
                              reportTypeId || localReportTypeId;
                            fetchIndicators(numericCategoryId, {
                              reportTypeId: effectiveReportTypeId,
                            });
                          }
                        }
                      }
                    }}
                    variant="outline"
                  >
                    Try Again
                  </Button>
                </div>
              ) : selectedCategory ? (
                <div className="space-y-4">
                  {indicators.length > 0 && (
                    <IndicatorTable
                      indicators={indicators}
                      selectedIndicators={selectedIndicators}
                      onSelectionChange={setSelectedIndicators}
                      onFilterByDateRange={filterIndicatorsByDateRange}
                      onFilterIndicatorByDateRange={filterIndicatorByDateRange}
                      isCombination={selectedCategory.id === "combination"}
                      externalSearchTerm={searchTerm}
                      externalSortBy={sortBy}
                    />
                  )}

                  {pagination && indicators.length > 0 && (
                    <div className="relative py-2">
                      {pagination.hasMore && (
                        <div
                          ref={sentinelRef}
                          className="h-8 w-full"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Please select a category first
                </div>
              )}
            </div>
          </div>
        );
      case 2:
        if (selectedCategory?.id === "combination") {
          return (
            <div className="space-y-6">
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold mb-2">
                    SELECT DATE RANGES
                  </h3>
                  <Card className="bg-muted border-border">
                    <CardContent className="p-6">
                      <DateRangePicker
                        value={combinationDateRange}
                        onChange={(range) => {
                          if (range) {
                            setCombinationDateRange(range);
                          }
                        }}
                        placeholder="Select date range"
                        className="w-full"
                      />
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold mb-2">Graph Type</h3>
                  <div className="grid grid-cols-3 gap-6">
                    <Card
                      onClick={() => setCombinationChartType("line")}
                      className={cn(
                        "cursor-pointer transition-all duration-200 hover:shadow-lg",
                        combinationChartType === "line"
                          ? "ring-2 ring-[#707FDD] bg-[#707FDD]/10 dark:bg-[#707FDD]/20 shadow-md"
                          : "hover:bg-muted/50"
                      )}
                    >
                      <CardContent className="p-8 text-center">
                        <div className="flex justify-center mb-3">
                          <LineChart className="h-8 w-8 text-blue-600" />
                        </div>
                        <div className="font-semibold text-base">Line</div>
                      </CardContent>
                    </Card>
                    <Card
                      onClick={() => setCombinationChartType("bar")}
                      className={cn(
                        "cursor-pointer transition-all duration-200 hover:shadow-lg",
                        combinationChartType === "bar"
                          ? "ring-2 ring-[#707FDD] bg-[#707FDD]/10 dark:bg-[#707FDD]/20 shadow-md"
                          : "hover:bg-muted/50"
                      )}
                    >
                      <CardContent className="p-8 text-center">
                        <div className="flex justify-center mb-3">
                          <BarChart3 className="h-8 w-8 text-green-600" />
                        </div>
                        <div className="font-semibold text-base">Bar</div>
                      </CardContent>
                    </Card>
                    <Card
                      onClick={() => setCombinationChartType("area")}
                      className={cn(
                        "cursor-pointer transition-all duration-200 hover:shadow-lg",
                        combinationChartType === "area"
                          ? "ring-2 ring-[#707FDD] bg-[#707FDD]/10 dark:bg-[#707FDD]/20 shadow-md"
                          : "hover:bg-muted/50"
                      )}
                    >
                      <CardContent className="p-8 text-center">
                        <div className="flex justify-center mb-3">
                          <TrendingUp className="h-8 w-8 text-purple-600" />
                        </div>
                        <div className="font-semibold text-base">
                          Candlestick
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          );
        }
        // For others: Chart Config step
        return (
          <div className="space-y-6">
            <div>
              <ChartConfigStep
                chartId={chartId}
                onConfigChange={handleConfigChange}
              />
            </div>
          </div>
        );
      case 3:
        // For combination: Chart Config step (they have an extra step)
        if (selectedCategory?.id === "combination") {
          return (
            <div className="space-y-6">
              <div>
                <ChartConfigStep
                  chartId={chartId}
                  onConfigChange={handleConfigChange}
                />
              </div>
            </div>
          );
        }
        // For others: Preview step
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <ChartPreview
                  selectedIndicators={selectedIndicators}
                  customization={chartCustomization}
                  title={initialTitle || `${selectedCategory?.title} Chart`}
                  indicatorNames={indicators.reduce((acc, indicator) => {
                    if ("indicator_id" in indicator) {
                      acc[indicator.indicator_id] = indicator.indicator_name;
                    } else if (indicator.id) {
                      acc[indicator.id?.toString()] = indicator.name;
                    }
                    return acc;
                  }, {} as Record<string, string>)}
                />
              </div>

              <div className="lg:col-span-1">
                {selectedCategory && (
                  <ChartSummary
                    selectedCategory={selectedCategory}
                    selectedIndicators={selectedIndicators}
                    position={chartPosition}
                    customization={chartCustomization}
                    title={`${selectedCategory.title} Chart`}
                    indicatorNames={(() => {
                      const namesFromIndicators = indicators.reduce(
                        (acc, indicator) => {
                          if ("indicator_id" in indicator) {
                            acc[indicator.indicator_id] =
                              indicator.indicator_name;
                          } else if (indicator.id) {
                            acc[indicator.id?.toString()] = indicator.name;
                          }
                          return acc;
                        },
                        {} as Record<string, string>
                      );

                      const namesFromSelected = selectedIndicators.reduce(
                        (acc, selected) => {
                          const subData = selected.subcategoryData as any;
                          if (subData?.indicator_name) {
                            acc[selected.indicatorId] = subData.indicator_name;
                          } else if (subData?.name) {
                            acc[selected.indicatorId] = subData.name;
                          } else if (
                            !namesFromIndicators[selected.indicatorId]
                          ) {
                            acc[selected.indicatorId] = selected.indicatorId;
                          }
                          return acc;
                        },
                        {} as Record<string, string>
                      );

                      return { ...namesFromIndicators, ...namesFromSelected };
                    })()}
                  />
                )}
              </div>
            </div>
          </div>
        );
      case 4:
        if (selectedCategory?.id === "combination") {
          return (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2 h-full">
                  <ChartPreview
                    selectedIndicators={selectedIndicators}
                    customization={chartCustomization}
                    title={initialTitle || `${selectedCategory?.title} Chart`}
                    indicatorNames={indicators.reduce((acc, indicator) => {
                      if ("indicator_id" in indicator) {
                        const combinedIndicator = indicator as {
                          indicator_id: string;
                          indicator_name: string;
                          categoryName?: string;
                        };
                        const categoryPrefix =
                          combinedIndicator.categoryName || "";
                        acc[indicator.indicator_id] = categoryPrefix
                          ? `${categoryPrefix} - ${indicator.indicator_name}`
                          : indicator.indicator_name;
                      }
                      return acc;
                    }, {} as Record<string, string>)}
                    className="h-full"
                  />
                </div>

                <div className="lg:col-span-1 h-full">
                  {selectedCategory && (
                    <ChartSummary
                      selectedCategory={selectedCategory}
                      selectedIndicators={selectedIndicators}
                      position={chartPosition}
                      customization={chartCustomization}
                      title={`${selectedCategory.title} Chart`}
                      indicatorNames={indicators.reduce((acc, indicator) => {
                        if ("indicator_id" in indicator) {
                          const combinedIndicator = indicator as {
                            indicator_id: string;
                            indicator_name: string;
                            categoryName?: string;
                          };
                          const categoryPrefix =
                            combinedIndicator.categoryName || "";
                          acc[indicator.indicator_id] = categoryPrefix
                            ? `${categoryPrefix} - ${indicator.indicator_name}`
                            : indicator.indicator_name;
                        }
                        return acc;
                      }, {} as Record<string, string>)}
                      className="h-full"
                    />
                  )}
                </div>
              </div>
            </div>
          );
        }
        return null;
      default:
        return <div>Step {currentStep + 1} content</div>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-6xl max-h-[95vh] overflow-y-auto p-0"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div className="p-6">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
        </div>

        {(isGeneratingChart || isUpdatingChart) && (
          <div className="h-1 bg-muted">
            <div
              className="h-full bg-[#707FDD] animate-pulse transition-all duration-300"
              style={{
                width: isGeneratingChart || isUpdatingChart ? "100%" : "0%",
              }}
            >
              <div className="h-full bg-gradient-to-r from-[#707FDD] via-[#5a6bc7] to-[#707FDD] animate-[shimmer_2s_infinite]" />
            </div>
          </div>
        )}

        <div className="px-6 py-4 bg-background">
          <div className="flex items-center w-full">
            {updatedSteps.map((step, index) => (
              <div
                key={step.id}
                className="flex items-center"
                style={{ flex: index < steps.length - 1 ? 1 : "none" }}
              >
                <div className="flex items-center shrink-0">
                  <div
                    className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-all duration-200",
                      step.isActive
                        ? "text-white shadow-lg"
                        : step.isCompleted
                        ? "bg-green-500 text-white"
                        : "bg-muted text-muted-foreground"
                    )}
                    style={step.isActive ? { backgroundColor: MAIN_COLOR } : {}}
                  >
                    {index + 1}
                  </div>
                  <span
                    className={cn(
                      "ml-2 text-xs font-medium transition-colors whitespace-nowrap",
                      step.isActive
                        ? "dark:text-purple-400"
                        : step.isCompleted
                        ? "text-green-600 dark:text-green-400"
                        : "text-gray-500 dark:text-gray-400"
                    )}
                    style={step.isActive ? { color: MAIN_COLOR } : {}}
                  >
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className="flex-1 mx-3 min-w-[20px]">
                    <div className="h-0.5 bg-gray-300 dark:bg-gray-600 relative">
                      <div
                        className={cn(
                          "absolute top-0 left-0 h-full transition-all duration-300",
                          step.isCompleted
                            ? "bg-green-500 w-full"
                            : step.isActive
                            ? "bg-blue-500 w-1/2"
                            : "bg-gray-300 dark:bg-gray-600 w-0"
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Search Controls - Fixed Position */}
        {currentStep === 1 && (
          <div className="px-8 py-4 border-b bg-background">
            {renderSearchControls?.()}
          </div>
        )}

        <div className="px-8 py-6 max-h-[55vh] overflow-y-auto">
          {renderStepContent()}
        </div>

        <div className="flex items-center justify-between p-6 border-t border-border">
          <Button
            variant="outline"
            onClick={currentStep > 0 ? handleBack : onClose}
            className="px-6 cursor-pointer"
          >
            {currentStep > 0 ? "Back" : "Cancel"}
          </Button>
          <Button
            onClick={handleNext}
            disabled={
              (currentStep === 0 && !selectedCategory) ||
              (currentStep === 1 && selectedIndicators.length === 0) ||
              ((currentStep === 3 || currentStep === 4) &&
                selectedCategory?.id !== "combination" &&
                selectedIndicators.length === 0) ||
              (currentStep === 4 &&
                selectedCategory?.id === "combination" &&
                selectedIndicators.length === 0) ||
              isGeneratingChart
            }
            className="px-6 text-white cursor-pointer"
            style={
              {
                backgroundColor: MAIN_COLOR,
                "--hover-color": MAIN_COLOR_HOVER,
              } as React.CSSProperties
            }
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = MAIN_COLOR_HOVER;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = MAIN_COLOR;
            }}
          >
            {isGeneratingChart ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : currentStep === steps.length - 1 ? (
              "Generate"
            ) : (
              "Next →"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
