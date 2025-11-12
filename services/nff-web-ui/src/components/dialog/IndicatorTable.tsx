"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePickerNative } from "@/components/ui/date-picker-native";
import { useIndicatorConfig } from "@/hooks/indicators";
import { CombinedIndicator } from "@/hooks/indicators/useIndicators";
import { cn } from "@/lib/utils";
import { SelectedIndicator } from "@/types";
import {
  BarChart3,
  Calendar,
  ChevronDown,
  ChevronRight,
  LineChart,
  Loader2,
  Search,
  Settings,
} from "lucide-react";
import { useMemo, useState } from "react";

const CHART_TYPE_OPTIONS_WITH_ICONS = [
  { value: "line", label: "Line Chart", icon: LineChart },
  { value: "bar", label: "Bar Chart", icon: BarChart3 },
];

interface SubcategoryData {
  name: string;
  id: number;
  indicators: string[];
  values: number[];
}

interface MacroIndicator {
  id: number;
  indicator_id: string;
  series_ids?: string;
  indicator_name: string;
  source: string;
  subcategory?: string;
  priority?: string;
  release_frequency?: string;
  units?: string;
  latest_date: string;
  latest_value: number;
  isDefault?: boolean;
  defaultChartType?: string;
  data_points: Array<{
    date: string;
    value: number;
    normalized_value?: number;
    z_score?: number;
  }>;
  subcategoryData: {
    name: string;
    id: number;
    indicators: string[];
    values: number[];
  };
}

interface IndicatorTableProps {
  indicators: SubcategoryData[] | MacroIndicator[] | CombinedIndicator[];
  selectedIndicators: SelectedIndicator[];
  onSelectionChange: (indicators: SelectedIndicator[]) => void;
  onDataReload?: (dateRangeOptions?: {
    dateRangeStart?: string;
    dateRangeEnd?: string;
  }) => Promise<void>;
  onFilterByDateRange?: (startDate: string, endDate: string) => void;
  onFilterIndicatorByDateRange?: (
    indicatorId: string,
    startDate: string,
    endDate: string
  ) => void;
  className?: string;
  blockId?: number;
  isCombination?: boolean;
  externalSearchTerm?: string;
  externalSortBy?: "name" | "date";
}

export function IndicatorTable({
  indicators,
  selectedIndicators,
  onSelectionChange,
  onDataReload,
  onFilterByDateRange,
  onFilterIndicatorByDateRange,
  className,
  blockId,
  isCombination = false,
  externalSearchTerm = "",
  externalSortBy = "name",
}: IndicatorTableProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedIndicators, setExpandedIndicators] = useState<Set<string>>(
    new Set()
  );
  const [groupConfigs, setGroupConfigs] = useState<
    Record<
      string,
      { chartType: string; dateRangeStart: string; dateRangeEnd: string }
    >
  >({});
  const [indicatorConfigs, setIndicatorConfigs] = useState<
    Record<
      string,
      { chartType: string; dateRangeStart: string; dateRangeEnd: string }
    >
  >({});
  const [togglingIndicators, setTogglingIndicators] = useState<Set<string>>(
    new Set()
  );
  const { updateIndicatorConfig, getIndicatorConfig } = useIndicatorConfig();
  const selectedIndicatorIds = useMemo(() => {
    const ids = new Set(selectedIndicators.map((si) => si.indicatorId));
    return ids;
  }, [selectedIndicators]);

  const filteredAndSortedIndicators = useMemo(() => {
    let filtered = [...indicators];

    if (externalSearchTerm.trim()) {
      const searchLower = externalSearchTerm.toLowerCase();
      filtered = filtered.filter((indicator) => {
        if ("indicator_id" in indicator) {
          const macro = indicator as MacroIndicator;
          return macro.indicator_name.toLowerCase().includes(searchLower);
        } else {
          const subcategory = indicator as SubcategoryData;
          return subcategory.name?.toLowerCase().includes(searchLower);
        }
      });
    }

    filtered.sort((a, b) => {
      const aIsDefault = "isDefault" in a ? a.isDefault : false;
      const bIsDefault = "isDefault" in b ? b.isDefault : false;

      if (aIsDefault && !bIsDefault) return -1;
      if (!aIsDefault && bIsDefault) return 1;

      if (externalSortBy === "name") {
        const nameA =
          "indicator_id" in a
            ? (a as MacroIndicator).indicator_name
            : (a as SubcategoryData).name;
        const nameB =
          "indicator_id" in b
            ? (b as MacroIndicator).indicator_name
            : (b as SubcategoryData).name;
        return nameA.localeCompare(nameB);
      } else if (externalSortBy === "date") {
        const dateA =
          "indicator_id" in a
            ? new Date((a as MacroIndicator).latest_date).getTime()
            : 0;
        const dateB =
          "indicator_id" in b
            ? new Date((b as MacroIndicator).latest_date).getTime()
            : 0;
        return dateB - dateA;
      }
      return 0;
    });

    return filtered;
  }, [indicators, externalSearchTerm, externalSortBy]);

  const handleIndicatorToggle = async (
    indicator: SubcategoryData | MacroIndicator,
    isSelected: boolean
  ) => {
    const indicatorId =
      "indicator_id" in indicator ? indicator.indicator_id : indicator.name;

    if (togglingIndicators.has(indicatorId)) {
      return;
    }

    setTogglingIndicators((prev) => new Set(prev).add(indicatorId));

    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      if (isSelected) {
        const defaultStartDate = new Date("2000-01-01");
        const currentDate =
          "latest_date" in indicator
            ? new Date(indicator.latest_date)
            : new Date();

        if ("indicator_id" in indicator) {
          const macroIndicator = indicator as MacroIndicator;
          const newSelectedIndicator: SelectedIndicator = {
            indicatorId: indicator.indicator_id,
            chartType: "bar" as const,
            dateRange: {
              preset: "CUSTOM" as const,
              customStart: defaultStartDate,
              customEnd: currentDate,
            },
            isSelected: true,
            config: {
              color: `hsl(${Math.random() * 360}, 70%, 50%)`,
              opacity: 0.8,
              lineWidth: 2,
              showDataLabels: false,
              showLegend: true,
            },
            value: indicator.latest_value,
            subcategoryData: macroIndicator.subcategoryData,
          };

          onSelectionChange([...selectedIndicators, newSelectedIndicator]);
        } else {
          const newSelectedIndicator: SelectedIndicator = {
            indicatorId: indicator.name,
            chartType: "line" as const,
            dateRange: {
              preset: "CUSTOM" as const,
              customStart: defaultStartDate,
              customEnd: currentDate,
            },
            isSelected: true,
            config: {
              color: `hsl(${Math.random() * 360}, 70%, 50%)`,
              opacity: 0.8,
              lineWidth: 2,
              showDataLabels: false,
              showLegend: true,
            },
            value: indicator.values[0] || 0,
            subcategoryData: indicator,
          };

          onSelectionChange([...selectedIndicators, newSelectedIndicator]);
        }
      } else {
        const indicatorId =
          "indicator_id" in indicator ? indicator.indicator_id : indicator.name;
        onSelectionChange(
          selectedIndicators.filter((si) => si.indicatorId !== indicatorId)
        );
      }
    } finally {
      setTogglingIndicators((prev) => {
        const newSet = new Set(prev);
        newSet.delete(indicatorId);
        return newSet;
      });
    }
  };

  const handleGroupExpand = async (
    groupName: string,
    indicatorGroup: SubcategoryData
  ) => {
    const newExpandedGroups = new Set(expandedGroups);
    if (expandedGroups.has(groupName)) {
      newExpandedGroups.delete(groupName);
    } else {
      newExpandedGroups.add(groupName);
      await loadGroupConfigs(indicatorGroup);
    }
    setExpandedGroups(newExpandedGroups);
  };

  const loadGroupConfigs = async (indicatorGroup: SubcategoryData) => {
    if (!indicatorGroup.indicators || indicatorGroup.indicators.length === 0)
      return;

    if (groupConfigs[indicatorGroup.name]) {
      return;
    }

    try {
      const config = await getIndicatorConfig(indicatorGroup.name, blockId);

      setGroupConfigs((prev) => ({
        ...prev,
        [indicatorGroup.name]: {
          chartType: config.chartType,
          dateRangeStart: config.dateRangeStart.split("T")[0],
          dateRangeEnd: config.dateRangeEnd.split("T")[0],
        },
      }));
    } catch (error) {
      console.error("Failed to load group configs:", error);
    }
  };

  const loadIndicatorConfig = async (indicatorId: string) => {
    if (indicatorConfigs[indicatorId]) {
      return;
    }

    try {
      const config = await getIndicatorConfig(indicatorId, blockId);

      setIndicatorConfigs((prev) => {
        const newConfigs = {
          ...prev,
          [indicatorId]: {
            chartType: config.chartType,
            dateRangeStart: config.dateRangeStart.split("T")[0],
            dateRangeEnd: config.dateRangeEnd.split("T")[0],
          },
        };
        return newConfigs;
      });
    } catch (error) {
      console.error(
        `Failed to load config for indicator ${indicatorId}:`,
        error
      );
    }
  };

  const handleGroupConfigUpdate = (
    groupName: string,
    config: { chartType: string; dateRangeStart: string; dateRangeEnd: string }
  ) => {
    setGroupConfigs((prev) => ({
      ...prev,
      [groupName]: config,
    }));
  };

  const handleIndicatorConfigUpdate = (
    indicatorId: string,
    config: { chartType: string; dateRangeStart: string; dateRangeEnd: string }
  ) => {
    setIndicatorConfigs((prev) => ({
      ...prev,
      [indicatorId]: config,
    }));
  };

  const handleIndicatorExpand = async (indicatorId: string) => {
    const newExpandedIndicators = new Set(expandedIndicators);
    if (expandedIndicators.has(indicatorId)) {
      newExpandedIndicators.delete(indicatorId);
    } else {
      newExpandedIndicators.add(indicatorId);
      await loadIndicatorConfig(indicatorId);
    }
    setExpandedIndicators(newExpandedIndicators);
  };

  const handleApplyGroupConfig = async (
    groupName: string,
    indicatorGroup: SubcategoryData
  ) => {
    const config = groupConfigs[groupName];
    if (!config) return;

    const groupIndicatorIds = [indicatorGroup.name];

    for (const indicatorId of groupIndicatorIds) {
      try {
        await updateIndicatorConfig(indicatorId.toString(), config, blockId);
      } catch (error) {
        console.error(
          `Failed to update config for indicator ${indicatorId}:`,
          error
        );
      }
    }

    const updatedIndicators = selectedIndicators.map((indicator) => {
      if (groupIndicatorIds.includes(indicator.indicatorId)) {
        return {
          ...indicator,
          chartType: config.chartType as
            | "line"
            | "bar"
            | "area"
            | "pie"
            | "scatter",
          dateRange: {
            ...indicator.dateRange,
            customStart: new Date(config.dateRangeStart),
            customEnd: new Date(config.dateRangeEnd),
          },
        };
      }
      return indicator;
    });

    onSelectionChange(updatedIndicators);

    await loadGroupConfigs(indicatorGroup);

    if (onFilterByDateRange) {
      onFilterByDateRange(config.dateRangeStart, config.dateRangeEnd);
    }

    if (onDataReload) {
      await onDataReload({
        dateRangeStart: config.dateRangeStart,
        dateRangeEnd: config.dateRangeEnd,
      });
    }

    const newExpandedGroups = new Set(expandedGroups);
    newExpandedGroups.delete(groupName);
    setExpandedGroups(newExpandedGroups);
  };

  const handleApplyIndicatorConfig = async (indicatorId: string) => {
    const config = indicatorConfigs[indicatorId];
    if (!config) return;

    try {
      await updateIndicatorConfig(indicatorId, config, blockId);
    } catch (error) {
      console.error(
        `Failed to update config for indicator ${indicatorId}:`,
        error
      );
    }

    const updatedIndicators = selectedIndicators.map((selectedIndicator) => {
      if (selectedIndicator.indicatorId === indicatorId) {
        return {
          ...selectedIndicator,
          chartType: config.chartType as
            | "line"
            | "bar"
            | "area"
            | "pie"
            | "scatter",
          dateRange: {
            ...selectedIndicator.dateRange,
            customStart: new Date(config.dateRangeStart),
            customEnd: new Date(config.dateRangeEnd),
          },
        };
      }
      return selectedIndicator;
    });

    onSelectionChange(updatedIndicators);
    await loadIndicatorConfig(indicatorId);

    if (onFilterIndicatorByDateRange) {
      onFilterIndicatorByDateRange(
        indicatorId,
        config.dateRangeStart,
        config.dateRangeEnd
      );
    }

    if (onDataReload) {
      await onDataReload({
        dateRangeStart: config.dateRangeStart,
        dateRangeEnd: config.dateRangeEnd,
      });
    }

    const newExpandedIndicators = new Set(expandedIndicators);
    newExpandedIndicators.delete(indicatorId);
    setExpandedIndicators(newExpandedIndicators);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {!isCombination && (
        <div className="hidden md:grid grid-cols-12 gap-6 text-xs font-medium text-gray-500 dark:text-gray-400 border-b pb-4">
          <div className="col-span-5 pl-2">Indicator</div>
          <div className="col-span-1 text-center">Default</div>
          <div className="col-span-2 text-center">Chart Type</div>
          <div className="col-span-3 text-center">Date Range</div>
          <div className="col-span-1 text-center">Config</div>
        </div>
      )}
      {isCombination && (
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 border-b pb-2">
          Indicator
        </div>
      )}

      {filteredAndSortedIndicators.length === 0 && externalSearchTerm && (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-4">
            <Search className="h-8 w-8 text-gray-400" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              No indicators found
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm">
              Try adjusting your search terms or clear the search to see all
              indicators.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {filteredAndSortedIndicators.map((indicatorGroup) => {
          if ("indicator_id" in indicatorGroup) {
            const macroIndicator = indicatorGroup as MacroIndicator;
            const isSelected = selectedIndicators.some(
              (si) => si.indicatorId === macroIndicator.indicator_id
            );
            const isLoading = togglingIndicators.has(
              macroIndicator.indicator_id
            );

            return (
              <div
                key={`indicator-${
                  macroIndicator.id || macroIndicator.indicator_id
                }`}
              >
                <Card
                  className={cn(
                    "transition-all duration-200",
                    isSelected && "ring-2 ring-[#707FDD] bg-[#707FDD]/5",
                    isLoading && "opacity-50 pointer-events-none"
                  )}
                >
                  <CardContent className="p-0">
                    {isCombination ? (
                      <div className="flex items-center space-x-3 p-4">
                        {isLoading ? (
                          <div className="flex items-center justify-center w-4 h-4">
                            <Loader2 className="h-3 w-3 animate-spin text-[#707FDD]" />
                          </div>
                        ) : (
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) =>
                              handleIndicatorToggle(
                                macroIndicator,
                                checked as boolean
                              )
                            }
                            onClick={(e) => e.stopPropagation()}
                            className="data-[state=checked]:bg-[#707FDD] data-[state=checked]:border-[#707FDD] cursor-pointer"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="relative group">
                              <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate cursor-help">
                                {(macroIndicator as CombinedIndicator)
                                  .categoryName
                                  ? `${
                                      (macroIndicator as CombinedIndicator)
                                        .categoryName
                                    } - ${macroIndicator.indicator_name}`
                                  : macroIndicator.indicator_name}
                              </div>
                              <div className="absolute bottom-full left-0 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[9999]">
                                {(macroIndicator as CombinedIndicator)
                                  .categoryName
                                  ? `${
                                      (macroIndicator as CombinedIndicator)
                                        .categoryName
                                    } - ${macroIndicator.indicator_name}`
                                  : macroIndicator.indicator_name}
                                <div className="absolute top-full left-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
                              </div>
                            </div>
                            {macroIndicator.isDefault && (
                              <Badge
                                variant="default"
                                className="bg-[#707FDD] text-white text-xs px-2 py-0.5 shrink-0"
                              >
                                Default
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-12 gap-6 p-4 items-center">
                        <div className="col-span-12 md:col-span-5 flex items-center space-x-3 pl-2">
                          {isLoading ? (
                            <div className="flex items-center justify-center w-4 h-4">
                              <Loader2 className="h-3 w-3 animate-spin text-[#707FDD]" />
                            </div>
                          ) : (
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) =>
                                handleIndicatorToggle(
                                  macroIndicator,
                                  checked as boolean
                                )
                              }
                              onClick={(e) => e.stopPropagation()}
                              className="data-[state=checked]:bg-[#707FDD] data-[state=checked]:border-[#707FDD] cursor-pointer"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="relative group">
                              <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate ">
                                {macroIndicator.indicator_name}
                              </div>
                              <div className="absolute bottom-full left-0 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[9999]">
                                {macroIndicator.indicator_name}
                                <div className="absolute top-full left-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
                              </div>
                            </div>
                            <div className="md:hidden flex items-center gap-4 mt-1">
                              {macroIndicator.isDefault && (
                                <Badge
                                  variant="default"
                                  className="bg-[#707FDD] text-white text-xs px-2 py-0.5 rounded-full"
                                >
                                  Default
                                </Badge>
                              )}
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {CHART_TYPE_OPTIONS_WITH_ICONS.find(
                                  (type) =>
                                    type.value ===
                                    (indicatorConfigs[
                                      macroIndicator.indicator_id
                                    ]?.chartType ||
                                      macroIndicator.defaultChartType ||
                                      "line")
                                )?.label || "Line Chart"}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="hidden md:flex col-span-1 justify-center">
                          {macroIndicator.isDefault && (
                            <Badge
                              variant="default"
                              className="bg-[#707FDD] text-white text-xs px-2 py-0.5 rounded-full"
                            >
                              Default
                            </Badge>
                          )}
                        </div>
                        <div className="hidden md:block col-span-2">
                          <div className="text-sm text-gray-600 dark:text-gray-300 text-center">
                            {CHART_TYPE_OPTIONS_WITH_ICONS.find(
                              (type) =>
                                type.value ===
                                (indicatorConfigs[macroIndicator.indicator_id]
                                  ?.chartType ||
                                  macroIndicator.defaultChartType ||
                                  "line")
                            )?.label || "Line Chart"}
                          </div>
                        </div>
                        <div className="hidden md:block col-span-3">
                          <div className="text-sm text-gray-600 dark:text-gray-300 text-center">
                            {indicatorConfigs[macroIndicator.indicator_id]
                              ?.dateRangeStart
                              ? new Date(
                                  indicatorConfigs[
                                    macroIndicator.indicator_id
                                  ].dateRangeStart
                                ).toLocaleDateString()
                              : new Date(
                                  "2000-01-01"
                                ).toLocaleDateString()}{" "}
                            -{" "}
                            {indicatorConfigs[macroIndicator.indicator_id]
                              ?.dateRangeEnd
                              ? new Date(
                                  indicatorConfigs[
                                    macroIndicator.indicator_id
                                  ].dateRangeEnd
                                ).toLocaleDateString()
                              : macroIndicator.latest_date 
                                ? new Date(macroIndicator.latest_date).toLocaleDateString()
                                : new Date().toLocaleDateString()}
                          </div>
                        </div>
                        <div className="col-span-12 md:col-span-1 flex justify-end md:justify-center mt-2 md:mt-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={!isSelected}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleIndicatorExpand(
                                macroIndicator.indicator_id
                              );
                            }}
                            className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {!isCombination &&
                  expandedIndicators.has(macroIndicator.indicator_id) && (
                    <Card className="mt-2">
                      <CardContent className="p-4">
                        <div className="space-y-4">
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Configure {macroIndicator.indicator_name}
                          </h4>

                          <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Date Range
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              <DatePickerNative
                                value={
                                  indicatorConfigs[macroIndicator.indicator_id]
                                    ?.dateRangeStart
                                    ? new Date(
                                        indicatorConfigs[
                                          macroIndicator.indicator_id
                                        ].dateRangeStart
                                      )
                                    : new Date("2000-01-01")
                                }
                                onChange={(date) => {
                                  handleIndicatorConfigUpdate(
                                    macroIndicator.indicator_id,
                                    {
                                      chartType:
                                        indicatorConfigs[
                                          macroIndicator.indicator_id
                                        ]?.chartType ||
                                        macroIndicator.defaultChartType ||
                                        "line",
                                      dateRangeStart: date
                                        ? date.toISOString().split("T")[0]
                                        : "2000-01-01",
                                      dateRangeEnd:
                                        indicatorConfigs[
                                          macroIndicator.indicator_id
                                        ]?.dateRangeEnd ||
                                        new Date().toISOString().split("T")[0],
                                    }
                                  );
                                }}
                                placeholder="Start Date"
                                className="text-xs h-10"
                                borderColor="#707FDD"
                              />
                              <DatePickerNative
                                value={
                                  indicatorConfigs[macroIndicator.indicator_id]
                                    ?.dateRangeEnd
                                    ? new Date(
                                        indicatorConfigs[
                                          macroIndicator.indicator_id
                                        ].dateRangeEnd
                                      )
                                    : new Date()
                                }
                                onChange={(date) => {
                                  handleIndicatorConfigUpdate(
                                    macroIndicator.indicator_id,
                                    {
                                      chartType:
                                        indicatorConfigs[
                                          macroIndicator.indicator_id
                                        ]?.chartType ||
                                        macroIndicator.defaultChartType ||
                                        "line",
                                      dateRangeStart:
                                        indicatorConfigs[
                                          macroIndicator.indicator_id
                                        ]?.dateRangeStart || "2000-01-01",
                                      dateRangeEnd: date
                                        ? date.toISOString().split("T")[0]
                                        : new Date()
                                            .toISOString()
                                            .split("T")[0],
                                    }
                                  );
                                }}
                                placeholder="End Date"
                                className="text-xs h-10"
                                borderColor="#707FDD"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                              Chart Type
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              {CHART_TYPE_OPTIONS_WITH_ICONS.map((type) => (
                                <Button
                                  key={type.value}
                                  variant={
                                    (indicatorConfigs[
                                      macroIndicator.indicator_id
                                    ]?.chartType ||
                                      macroIndicator.defaultChartType ||
                                      "line") === type.value
                                      ? "default"
                                      : "outline"
                                  }
                                  size="sm"
                                  onClick={() => {
                                    handleIndicatorConfigUpdate(
                                      macroIndicator.indicator_id,
                                      {
                                        chartType: type.value,
                                        dateRangeStart:
                                          indicatorConfigs[
                                            macroIndicator.indicator_id
                                          ]?.dateRangeStart || "2000-01-01",
                                        dateRangeEnd:
                                          indicatorConfigs[
                                            macroIndicator.indicator_id
                                          ]?.dateRangeEnd ||
                                          new Date()
                                            .toISOString()
                                            .split("T")[0],
                                      }
                                    );
                                  }}
                                  className="text-xs h-10 px-3 flex items-center justify-center gap-2"
                                >
                                  <type.icon className="h-4 w-4" />
                                  {type.label}
                                </Button>
                              ))}
                            </div>
                          </div>

                          <div className="flex justify-end">
                            <Button
                              onClick={() =>
                                handleApplyIndicatorConfig(
                                  macroIndicator.indicator_id
                                )
                              }
                              className="text-xs"
                            >
                              Apply to Indicator
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
              </div>
            );
          } else if (indicatorGroup.name && indicatorGroup.indicators) {
            const subcategory = indicatorGroup as SubcategoryData;
            const subcategorySelected = selectedIndicatorIds.has(
              subcategory.name
            );

            return (
              <div key={`subcategory-${subcategory.id || subcategory.name}`}>
                <Card
                  className={cn(
                    "transition-all duration-200",
                    subcategorySelected &&
                      "ring-2 ring-[#707FDD] bg-[#707FDD]/5"
                  )}
                >
                  <CardContent className="p-0">
                    <div className="grid grid-cols-12 gap-6 p-4 items-center">
                      <div className="col-span-12 md:col-span-5 flex items-center space-x-3 pl-2">
                        <Checkbox
                          checked={subcategorySelected}
                          onCheckedChange={(checked) =>
                            handleIndicatorToggle(
                              subcategory,
                              checked as boolean
                            )
                          }
                          className="data-[state=checked]:bg-[#707FDD] data-[state=checked]:border-[#707FDD] cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="relative group">
                            <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate cursor-help">
                              {subcategory.name}
                            </div>
                            <div className="absolute bottom-full left-0 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-[9999]">
                              {subcategory.name}
                              <div className="absolute top-full left-2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {subcategory.indicators.length} indicators
                          </div>
                          <div className="md:hidden flex items-center gap-4 mt-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {CHART_TYPE_OPTIONS_WITH_ICONS.find(
                                (type) =>
                                  type.value ===
                                  (groupConfigs[subcategory.name || ""]
                                    ?.chartType || "line")
                              )?.label || "Line Chart"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="hidden md:block col-span-1"></div>

                      <div className="hidden md:block col-span-2">
                        <div className="text-sm text-gray-600 dark:text-gray-300 text-center">
                          {CHART_TYPE_OPTIONS_WITH_ICONS.find(
                            (type) =>
                              type.value ===
                              (groupConfigs[subcategory.name || ""]
                                ?.chartType || "line")
                          )?.label || "Line Chart"}
                        </div>
                      </div>

                      <div className="hidden md:block col-span-3">
                        <div className="text-sm text-gray-600 dark:text-gray-300 text-center">
                          {groupConfigs[subcategory.name || ""]?.dateRangeStart
                            ? new Date(
                                groupConfigs[
                                  subcategory.name || ""
                                ].dateRangeStart
                              ).toLocaleDateString()
                            : new Date("2000-01-01").toLocaleDateString()}{" "}
                          -{" "}
                          {groupConfigs[subcategory.name || ""]?.dateRangeEnd
                            ? new Date(
                                groupConfigs[
                                  subcategory.name || ""
                                ].dateRangeEnd
                              ).toLocaleDateString()
                            : new Date().toLocaleDateString()}
                        </div>
                      </div>

                      <div className="col-span-12 md:col-span-1 flex justify-end md:justify-center mt-2 md:mt-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={!subcategorySelected}
                          onClick={() =>
                            handleGroupExpand(
                              subcategory.name || "",
                              subcategory
                            )
                          }
                          className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {expandedGroups.has(subcategory.name || "") ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {expandedGroups.has(subcategory.name || "") && (
                  <Card className="mt-2">
                    <CardContent className="p-4">
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Configure {subcategory.name} Group
                        </h4>

                        <div className="space-y-2">
                          <label className="text-xs font-medium text-gray-600 dark:text-gray-400 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Date Range
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <DatePickerNative
                              value={
                                groupConfigs[subcategory.name || ""]
                                  ?.dateRangeStart
                                  ? new Date(
                                      groupConfigs[
                                        subcategory.name || ""
                                      ].dateRangeStart
                                    )
                                  : new Date("2000-01-01")
                              }
                              onChange={(date) => {
                                const groupName = subcategory.name || "";
                                handleGroupConfigUpdate(groupName, {
                                  chartType:
                                    groupConfigs[groupName]?.chartType ||
                                    "line",
                                  dateRangeStart: date
                                    ? date.toISOString().split("T")[0]
                                    : "2000-01-01",
                                  dateRangeEnd:
                                    groupConfigs[groupName]?.dateRangeEnd ||
                                    new Date().toISOString().split("T")[0],
                                });
                              }}
                              placeholder="Start Date"
                              className="text-xs h-10"
                              borderColor="#707FDD"
                            />
                            <DatePickerNative
                              value={
                                groupConfigs[subcategory.name || ""]
                                  ?.dateRangeEnd
                                  ? new Date(
                                      groupConfigs[
                                        subcategory.name || ""
                                      ].dateRangeEnd
                                    )
                                  : new Date()
                              }
                              onChange={(date) => {
                                const groupName = subcategory.name || "";
                                handleGroupConfigUpdate(groupName, {
                                  chartType:
                                    groupConfigs[groupName]?.chartType ||
                                    "line",
                                  dateRangeStart:
                                    groupConfigs[groupName]?.dateRangeStart ||
                                    "2000-01-01",
                                  dateRangeEnd: date
                                    ? date.toISOString().split("T")[0]
                                    : new Date().toISOString().split("T")[0],
                                });
                              }}
                              placeholder="End Date"
                              className="text-xs h-10"
                              borderColor="#707FDD"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            Chart Type
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {CHART_TYPE_OPTIONS_WITH_ICONS.map((type) => (
                              <Button
                                key={type.value}
                                variant={
                                  (groupConfigs[subcategory.name || ""]
                                    ?.chartType || "line") === type.value
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() => {
                                  const groupName = subcategory.name || "";
                                  handleGroupConfigUpdate(groupName, {
                                    chartType: type.value,
                                    dateRangeStart:
                                      groupConfigs[groupName]?.dateRangeStart ||
                                      "2000-01-01",
                                    dateRangeEnd:
                                      groupConfigs[groupName]?.dateRangeEnd ||
                                      new Date().toISOString().split("T")[0],
                                  });
                                }}
                                className="text-xs h-10 px-3 flex items-center justify-center gap-2"
                              >
                                <type.icon className="h-4 w-4" />
                                {type.label}
                              </Button>
                            ))}
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <Button
                            onClick={() =>
                              handleApplyGroupConfig(
                                subcategory.name || "",
                                subcategory
                              )
                            }
                            className="text-xs"
                          >
                            Apply to Group
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {expandedGroups.has(subcategory.name || "") && (
                  <div className="mt-4 space-y-2">
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Indicators in {subcategory.name}:
                    </h5>
                    <div className="grid grid-cols-1 gap-2">
                      {subcategory.indicators.map(
                        (indicatorName: string, index: number) => (
                          <div
                            key={`${subcategory.name}-${indicatorName}-${index}`}
                            className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-800 rounded"
                          >
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {indicatorName}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-500">
                              (Value:{" "}
                              {subcategory.values[index]?.toFixed(2) || "N/A"})
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          } else {
            return null;
          }
        })}
      </div>
    </div>
  );
}
