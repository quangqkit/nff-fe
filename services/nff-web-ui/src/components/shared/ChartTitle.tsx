"use client";

import { cn } from "@/lib/utils";

interface ChartTitleProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export function ChartTitle({ title, subtitle, className }: ChartTitleProps) {
  return (
    <div className={cn("mb-4", className)}>
      <h3 className="text-lg font-semibold text-gray-800 mb-1">{title}</h3>
      {subtitle && (
        <p className="text-sm text-gray-600">{subtitle}</p>
      )}
    </div>
  );
}
