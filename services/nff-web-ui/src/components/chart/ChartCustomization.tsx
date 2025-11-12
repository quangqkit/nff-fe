"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import type { ChartCustomization } from "@/types";
import { 
  FONT_FAMILY_OPTIONS, 
  FONT_WEIGHT_OPTIONS, 
  ASPECT_RATIO_OPTIONS, 
  ICON_STYLE_OPTIONS,
  THEME_MODE_OPTIONS,
  COLOR_PALETTE_OPTIONS,
  getColorScheme
} from "@/constants/chart-config";
import { cn } from "@/lib/utils";

interface ChartCustomizationProps {
  customization: ChartCustomization;
  onCustomizationChange: (customization: ChartCustomization) => void;
  className?: string;
}

export function ChartCustomization({
  customization,
  onCustomizationChange,
  className,
}: ChartCustomizationProps) {
  const [activeTab, setActiveTab] = useState<'colors' | 'typography' | 'icons' | 'size' | 'theme'>('colors');

  const updateCustomization = (updates: Partial<ChartCustomization>) => {
    onCustomizationChange({ ...customization, ...updates });
  };

  const updateColors = (colorUpdates: Partial<ChartCustomization['colors']>) => {
    updateCustomization({
      colors: { ...customization.colors, ...colorUpdates }
    });
  };

  const updateTypography = (typographyUpdates: Partial<ChartCustomization['typography']>) => {
    updateCustomization({
      typography: { ...customization.typography, ...typographyUpdates }
    });
  };

  const updateIcons = (iconUpdates: Partial<ChartCustomization['icons']>) => {
    updateCustomization({
      icons: { ...customization.icons, ...iconUpdates }
    });
  };

  const updateSize = (sizeUpdates: Partial<ChartCustomization['size']>) => {
    updateCustomization({
      size: { ...customization.size, ...sizeUpdates }
    });
  };

  const updateTheme = (themeUpdates: Partial<ChartCustomization['theme']>) => {
    updateCustomization({
      theme: { ...customization.theme, ...themeUpdates }
    });
  };

  const applyColorScheme = (palette: string) => {
    const scheme = getColorScheme(palette);
    updateColors(scheme);
    updateTheme({ palette: palette as unknown as 'default' | 'colorful' | 'monochrome' | 'pastel' });
  };

  const tabs = [
    { id: 'colors', label: 'Colors', icon: '🎨' },
    { id: 'typography', label: 'Typography', icon: '📝' },
    { id: 'icons', label: 'Icons', icon: '🔧' },
    { id: 'size', label: 'Size', icon: '📏' },
    { id: 'theme', label: 'Theme', icon: '🌙' },
  ] as const;

  return (
    <div className={cn("space-y-6", className)}>
      <div>
        <h3 className="text-lg font-semibold mb-4">Chart Customization</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Customize colors, font size, icons, size and other visual properties of your chart.
        </p>
        
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center space-x-2"
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </Button>
          ))}
        </div>

        <div className="space-y-6">
          {activeTab === 'colors' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Color Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Color Palette</label>
                  <Select
                    value={customization.theme.palette}
                    onValueChange={applyColorScheme}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COLOR_PALETTE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex flex-col">
                            <span className="font-medium">{option.label}</span>
                            <span className="text-xs text-gray-500">{option.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Primary Color</label>
                    <input
                      type="color"
                      value={customization.colors.primary}
                      onChange={(e) => updateColors({ primary: e.target.value })}
                      className="w-full h-10 rounded border border-gray-300 dark:border-gray-600"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Secondary Color</label>
                    <input
                      type="color"
                      value={customization.colors.secondary}
                      onChange={(e) => updateColors({ secondary: e.target.value })}
                      className="w-full h-10 rounded border border-gray-300 dark:border-gray-600"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Background</label>
                    <input
                      type="color"
                      value={customization.colors.background}
                      onChange={(e) => updateColors({ background: e.target.value })}
                      className="w-full h-10 rounded border border-gray-300 dark:border-gray-600"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Text Color</label>
                    <input
                      type="color"
                      value={customization.colors.text}
                      onChange={(e) => updateColors({ text: e.target.value })}
                      className="w-full h-10 rounded border border-gray-300 dark:border-gray-600"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'typography' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Typography Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Font Family</label>
                    <Select
                      value={customization.typography.fontFamily}
                      onValueChange={(value) => updateTypography({ fontFamily: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_FAMILY_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex flex-col">
                              <span className="font-medium">{option.label}</span>
                              <span className="text-xs text-gray-500">{option.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Font Weight</label>
                    <Select
                      value={customization.typography.fontWeight}
                      onValueChange={(value) => updateTypography({ fontWeight: value as unknown as 'normal' | 'medium' | 'semibold' | 'bold' })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_WEIGHT_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex flex-col">
                              <span className="font-medium">{option.label}</span>
                              <span className="text-xs text-gray-500">{option.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Font Size</label>
                    <input
                      type="range"
                      min="10"
                      max="24"
                      value={customization.typography.fontSize}
                      onChange={(e) => updateTypography({ fontSize: parseInt(e.target.value) })}
                      className="w-full"
                    />
                    <div className="text-xs text-gray-500 mt-1">{customization.typography.fontSize}px</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Title Size</label>
                    <input
                      type="range"
                      min="14"
                      max="32"
                      value={customization.typography.titleSize}
                      onChange={(e) => updateTypography({ titleSize: parseInt(e.target.value) })}
                      className="w-full"
                    />
                    <div className="text-xs text-gray-500 mt-1">{customization.typography.titleSize}px</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Label Size</label>
                    <input
                      type="range"
                      min="8"
                      max="16"
                      value={customization.typography.labelSize}
                      onChange={(e) => updateTypography({ labelSize: parseInt(e.target.value) })}
                      className="w-full"
                    />
                    <div className="text-xs text-gray-500 mt-1">{customization.typography.labelSize}px</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'icons' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Icon & Display Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Icon Style</label>
                    <Select
                      value={customization.icons.iconStyle}
                      onValueChange={(value) => updateIcons({ iconStyle: value as unknown as 'outline' | 'filled' | 'minimal' })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ICON_STYLE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex flex-col">
                              <span className="font-medium">{option.label}</span>
                              <span className="text-xs text-gray-500">{option.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={customization.icons.showLegend}
                      onCheckedChange={(checked) => updateIcons({ showLegend: checked as boolean })}
                    />
                    <label className="text-sm">Show Legend</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={customization.icons.showDataLabels}
                      onCheckedChange={(checked) => updateIcons({ showDataLabels: checked as boolean })}
                    />
                    <label className="text-sm">Show Data Labels</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={customization.icons.showGrid}
                      onCheckedChange={(checked) => updateIcons({ showGrid: checked as boolean })}
                    />
                    <label className="text-sm">Show Grid</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={customization.icons.showAxes}
                      onCheckedChange={(checked) => updateIcons({ showAxes: checked as boolean })}
                    />
                    <label className="text-sm">Show Axes</label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'size' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Size Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Width</label>
                    <input
                      type="range"
                      min="400"
                      max="1200"
                      step="50"
                      value={customization.size.width}
                      onChange={(e) => updateSize({ width: parseInt(e.target.value) })}
                      className="w-full"
                    />
                    <div className="text-xs text-gray-500 mt-1">{customization.size.width}px</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Height</label>
                    <input
                      type="range"
                      min="200"
                      max="800"
                      step="50"
                      value={customization.size.height}
                      onChange={(e) => updateSize({ height: parseInt(e.target.value) })}
                      className="w-full"
                    />
                    <div className="text-xs text-gray-500 mt-1">{customization.size.height}px</div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Aspect Ratio</label>
                  <Select
                    value={customization.size.aspectRatio}
                    onValueChange={(value) => updateSize({ aspectRatio: value as unknown as 'auto' | 'square' | 'wide' | 'tall' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ASPECT_RATIO_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex flex-col">
                            <span className="font-medium">{option.label}</span>
                            <span className="text-xs text-gray-500">{option.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={customization.size.responsive}
                    onCheckedChange={(checked) => updateSize({ responsive: checked as boolean })}
                  />
                  <label className="text-sm">Responsive sizing</label>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'theme' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Theme Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Theme Mode</label>
                    <Select
                      value={customization.theme.mode}
                      onValueChange={(value) => updateTheme({ mode: value as unknown as 'light' | 'dark' | 'auto' })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {THEME_MODE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex flex-col">
                              <span className="font-medium">{option.label}</span>
                              <span className="text-xs text-gray-500">{option.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
