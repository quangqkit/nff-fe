"use client";

import { Calendar as CalendarIcon } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

interface DatePickerNativeProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  min?: string;
  max?: string;
  borderColor?: string;
}

export function DatePickerNative({
  value,
  onChange,
  placeholder = "Pick a date",
  className,
  disabled = false,
  min,
  max,
  borderColor,
}: DatePickerNativeProps) {
  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = event.target.value;
    if (dateValue) {
      onChange?.(new Date(dateValue));
    } else {
      onChange?.(undefined);
    }
  };

  const formatDateForInput = (date: Date | undefined): string => {
    if (!date) return "";
    return date.toISOString().split("T")[0];
  };

  return (
    <div className="relative w-full">
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
        <CalendarIcon className="h-4 w-4 text-gray-400" />
      </div>
      <input
        type="date"
        value={formatDateForInput(value)}
        onChange={handleDateChange}
        disabled={disabled}
        min={min}
        max={max}
        placeholder={placeholder}
        lang="en-US"
        className={cn(
          "w-full pl-10 pr-3 py-2 bg-background rounded-md text-sm border border-input",
          "focus:outline-none focus:ring-2 focus:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          !value && "text-muted-foreground",
          className
        )}
        style={borderColor ? { borderColor } : undefined}
      />
    </div>
  );
}
