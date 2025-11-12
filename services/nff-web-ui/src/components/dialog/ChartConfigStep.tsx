"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Type,
  Palette,
  MousePointer,
  Square,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Layers,
} from "lucide-react";

interface ChartConfigStepProps {
  chartId?: number;
  onConfigChange: (config: { position: string; customConfig: string }) => void;
  className?: string;
}

const POSITION_OPTIONS = [
  {
    id: "inline",
    label: "In line with text",
    description: "Chart flows with text content",
    icon: AlignLeft,
  },
  {
    id: "square",
    label: "Square",
    description: "Text wraps around chart in square shape",
    icon: Square,
  },
  {
    id: "tight",
    label: "Tight",
    description: "Text wraps closely around chart contours",
    icon: MousePointer,
  },
  {
    id: "through",
    label: "Through",
    description: "Text flows through chart area",
    icon: Layers,
  },
  {
    id: "top-bottom",
    label: "Top and bottom",
    description: "Text above and below chart only",
    icon: AlignCenter,
  },
  {
    id: "behind",
    label: "Behind text",
    description: "Chart positioned behind text",
    icon: AlignRight,
  },
  {
    id: "front",
    label: "In front of text",
    description: "Chart positioned in front of text",
    icon: Layers,
  },
];

const CUSTOM_CONFIG_DEFAULTS = {
  colors: {
    primary: "#3B82F6",
    secondary: "#10B981",
    background: "#FFFFFF",
    text: "#1F2937",
    grid: "#E5E7EB",
  },
  typography: {
    fontFamily: "Inter, sans-serif",
    fontSize: 16,
    fontWeight: "normal" as const,
    titleSize: 18,
    labelSize: 14,
  },
  icons: {
    showLegend: true,
    showDataLabels: true,
    showGrid: true,
    showAxes: true,
    iconStyle: "outline" as const,
  },
  size: {
    aspectRatio: "auto" as const,
    width: 400,
    height: 300,
    responsive: true,
  },
  theme: {
    mode: "light" as const,
    palette: "default" as const,
  },
  fontSize: "16px",
  icon: "chart-line",
  borderRadius: "8px",
};

const FONT_SIZE_OPTIONS = [
  { value: "12px", label: "12px - Small" },
  { value: "14px", label: "14px - Regular" },
  { value: "16px", label: "16px - Medium" },
  { value: "18px", label: "18px - Large" },
  { value: "20px", label: "20px - Extra Large" },
  { value: "24px", label: "24px - Heading" },
];

const ICON_OPTIONS = [
  { value: "chart-line", label: "Line Chart" },
  { value: "chart-bar", label: "Bar Chart" },
  { value: "chart-area", label: "Area Chart" },
  { value: "chart-pie", label: "Pie Chart" },
  { value: "chart-scatter", label: "Scatter Chart" },
  { value: "trending-up", label: "Trending Up" },
  { value: "activity", label: "Activity" },
];

const BORDER_RADIUS_OPTIONS = [
  { value: "0px", label: "0px - Square" },
  { value: "4px", label: "4px - Small" },
  { value: "8px", label: "8px - Medium" },
  { value: "12px", label: "12px - Large" },
  { value: "16px", label: "16px - Extra Large" },
  { value: "50%", label: "50% - Circle" },
];

export function ChartConfigStep({
  onConfigChange,
  className,
}: ChartConfigStepProps) {
  const [selectedPosition, setSelectedPosition] = useState("square");
  const [customConfig, setCustomConfig] = useState(CUSTOM_CONFIG_DEFAULTS);

  useEffect(() => {
    onConfigChange({
      position: selectedPosition,
      customConfig: JSON.stringify(customConfig),
    });
  }, [selectedPosition, customConfig, onConfigChange]);

  const handlePositionChange = (positionId: string) => {
    setSelectedPosition(positionId);
  };

  const handleCustomConfigChange = (key: string, value: string) => {
    if (key.includes(".")) {
      const [parent, child] = key.split(".");
      setCustomConfig((prev) => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as Record<string, string>),
          [child]: value,
        },
      }));
    } else {
      setCustomConfig((prev) => ({
        ...prev,
        [key]: value,
      }));
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <MousePointer className="h-5 w-5 text-[#707FDD]" />
          <Label className="text-base font-medium">
            Choose position of the chart
          </Label>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {POSITION_OPTIONS.map((option) => {
            const Icon = option.icon as React.ComponentType<{
              className?: string;
            }>;
            const isSelected = selectedPosition === option.id;

            return (
              <Card
                key={option.id}
                className={cn(
                  "cursor-pointer transition-all duration-200 hover:shadow-md",
                  isSelected
                    ? "ring-2 ring-[#707FDD] bg-[#707FDD]/10 dark:bg-[#707FDD]/20"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800"
                )}
                onClick={() => handlePositionChange(option.id)}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col items-center space-y-3">
                    <Icon
                      className={cn(
                        "h-6 w-6",
                        isSelected ? "text-[#707FDD]" : "text-gray-500"
                      )}
                    />
                    <div className="text-center">
                      <div
                        className={cn(
                          "font-medium text-sm",
                          isSelected
                            ? "text-[#707FDD] dark:text-[#707FDD]"
                            : "text-gray-900 dark:text-gray-100"
                        )}
                      >
                        {option.label}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {option.description}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Palette className="h-5 w-5 text-[#707FDD]" />
          <Label className="text-base font-medium">
            Custom Chart Configuration
          </Label>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Palette className="h-4 w-4 text-gray-600" />
              <Label className="text-sm font-medium">Colors</Label>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-xs text-gray-600 dark:text-gray-400">
                  Primary Color
                </Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="color"
                    value={customConfig.colors.primary}
                    onChange={(e) =>
                      handleCustomConfigChange("colors.primary", e.target.value)
                    }
                    className="w-12 h-8 p-1 border rounded"
                  />
                  <Input
                    type="text"
                    value={customConfig.colors.primary}
                    onChange={(e) =>
                      handleCustomConfigChange("colors.primary", e.target.value)
                    }
                    className="flex-1 text-xs"
                    placeholder="#3B82F6"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-gray-600 dark:text-gray-400">
                  Secondary Color
                </Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="color"
                    value={customConfig.colors.secondary}
                    onChange={(e) =>
                      handleCustomConfigChange(
                        "colors.secondary",
                        e.target.value
                      )
                    }
                    className="w-12 h-8 p-1 border rounded"
                  />
                  <Input
                    type="text"
                    value={customConfig.colors.secondary}
                    onChange={(e) =>
                      handleCustomConfigChange(
                        "colors.secondary",
                        e.target.value
                      )
                    }
                    className="flex-1 text-xs"
                    placeholder="#10B981"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-gray-600 dark:text-gray-400">
                  Background Color
                </Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="color"
                    value={customConfig.colors.background}
                    onChange={(e) =>
                      handleCustomConfigChange(
                        "colors.background",
                        e.target.value
                      )
                    }
                    className="w-12 h-8 p-1 border rounded"
                  />
                  <Input
                    type="text"
                    value={customConfig.colors.background}
                    onChange={(e) =>
                      handleCustomConfigChange(
                        "colors.background",
                        e.target.value
                      )
                    }
                    className="flex-1 text-xs"
                    placeholder="#FFFFFF"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Type className="h-4 w-4 text-gray-600" />
              <Label className="text-sm font-medium">Typography & Layout</Label>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-xs text-gray-600 dark:text-gray-400">
                  Font Size
                </Label>
                <Select
                  value={customConfig.fontSize}
                  onValueChange={(value) =>
                    handleCustomConfigChange("fontSize", value)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select font size" />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_SIZE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-gray-600 dark:text-gray-400">
                  Icon
                </Label>
                <Select
                  value={customConfig.icon}
                  onValueChange={(value) =>
                    handleCustomConfigChange("icon", value)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select icon" />
                  </SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-gray-600 dark:text-gray-400">
                  Border Radius
                </Label>
                <Select
                  value={customConfig.borderRadius}
                  onValueChange={(value) =>
                    handleCustomConfigChange("borderRadius", value)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select border radius" />
                  </SelectTrigger>
                  <SelectContent>
                    {BORDER_RADIUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
