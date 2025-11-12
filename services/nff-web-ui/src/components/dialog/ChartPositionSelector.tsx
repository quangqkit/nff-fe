"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ChartPosition } from "@/types";
import { CHART_POSITION_OPTIONS } from "@/constants/chart-config";
import { cn } from "@/lib/utils";

interface ChartPositionSelectorProps {
  selectedPosition: ChartPosition;
  onPositionChange: (position: ChartPosition) => void;
  className?: string;
}

export function ChartPositionSelector({
  selectedPosition,
  onPositionChange,
  className,
}: ChartPositionSelectorProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <h3 className="text-lg font-semibold mb-4">Choose position of the chart</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {CHART_POSITION_OPTIONS.map((option) => (
            <Card
              key={option.value}
              className={cn(
                "cursor-pointer transition-all duration-200 hover:shadow-md h-32",
                selectedPosition === option.value
                  ? "ring-2 ring-green-500 bg-green-50 dark:bg-green-900/20"
                  : "hover:bg-gray-50 dark:hover:bg-gray-800"
              )}
              onClick={() => onPositionChange(option.value as ChartPosition)}
            >
              <CardContent className="p-4 h-full flex flex-col items-center justify-center space-y-3">
                <div className="text-3xl">{option.icon}</div>
                
                <div className="text-center flex-1 flex flex-col justify-center">
                  <div className="font-medium text-sm text-gray-900 dark:text-gray-100 leading-tight">
                    {option.label}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-tight">
                    {option.description}
                  </div>
                </div>
                
                {selectedPosition === option.value && (
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
    </div>
  );
}
