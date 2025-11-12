"use client";

import { useState, useEffect } from "react";
import { X, Calendar, BarChart3, TrendingUp, AreaChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Indicator } from "@/types";

interface IndicatorConfigDialogProps {
  isOpen: boolean;
  onClose: () => void;
  indicator: Indicator | null;
  currentConfig?: {
    chartType: string;
    dateRangeStart: string;
    dateRangeEnd: string;
  };
  onSave: (config: {
    chartType: string;
    dateRangeStart: string;
    dateRangeEnd: string;
  }) => Promise<void>;
}

const CHART_TYPES = [
  {
    id: "line",
    label: "Line",
    icon: TrendingUp,
  },
  {
    id: "bar",
    label: "Bar",
    icon: BarChart3,
  },
  {
    id: "area",
    label: "Area",
    icon: AreaChart,
  },
];

export function IndicatorConfigDialog({
  isOpen,
  onClose,
  indicator,
  currentConfig,
  onSave,
}: IndicatorConfigDialogProps) {
  const [chartType, setChartType] = useState("line");
  const [dateRangeStart, setDateRangeStart] = useState("");
  const [dateRangeEnd, setDateRangeEnd] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (indicator) {
      if (currentConfig) {
        setChartType(currentConfig.chartType);
        setDateRangeStart(currentConfig.dateRangeStart);
        setDateRangeEnd(currentConfig.dateRangeEnd);
      } else {
        setChartType(indicator.defaultChartType);
        const defaultStartDate = new Date("2000-01-01");
        const currentDate = new Date(indicator.latest_date);

        setDateRangeStart(defaultStartDate.toISOString().split("T")[0]);
        setDateRangeEnd(currentDate.toISOString().split("T")[0]);
      }
    }
  }, [indicator, currentConfig]);

  const handleSave = async () => {
    if (!indicator) return;

    setIsSubmitting(true);
    try {
      await onSave({
        chartType,
        dateRangeStart,
        dateRangeEnd,
      });
      onClose();
    } catch (error) {
      console.error("Error saving indicator config:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!isOpen || !indicator) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={handleClose}
      />
      <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl mx-4 animate-in fade-in-0 zoom-in-95 duration-300">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {indicator.name} Configuration
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            disabled={isSubmitting}
            className="h-8 w-8 rounded-full border border-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <Label className="text-base font-medium">Date Range</Label>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <Label
                    htmlFor="start-date"
                    className="text-sm text-gray-600 dark:text-gray-400"
                  >
                    Start Date
                  </Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={dateRangeStart}
                    onChange={(e) => setDateRangeStart(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <Label
                    htmlFor="end-date"
                    className="text-sm text-gray-600 dark:text-gray-400"
                  >
                    End Date
                  </Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={dateRangeEnd}
                    onChange={(e) => setDateRangeEnd(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <Label className="text-base font-medium">Chart Type</Label>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {CHART_TYPES.map((type) => {
                  const Icon = type.icon;
                  const isSelected = chartType === type.id;

                  return (
                    <Card
                      key={type.id}
                      className={cn(
                        "cursor-pointer transition-all duration-200 hover:shadow-md",
                        isSelected
                          ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "hover:bg-gray-50 dark:hover:bg-gray-800"
                      )}
                      onClick={() => !isSubmitting && setChartType(type.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex flex-col items-center space-y-2">
                          <Icon
                            className={cn(
                              "h-5 w-5",
                              isSelected ? "text-blue-600" : "text-gray-500"
                            )}
                          />
                          <div
                            className={cn(
                              "text-xs font-medium text-center",
                              isSelected
                                ? "text-blue-900 dark:text-blue-100"
                                : "text-gray-900 dark:text-gray-100"
                            )}
                          >
                            {type.label}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSubmitting || !dateRangeStart || !dateRangeEnd}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? "Saving..." : "Confirm"}
          </Button>
        </div>
      </div>
    </div>
  );
}
