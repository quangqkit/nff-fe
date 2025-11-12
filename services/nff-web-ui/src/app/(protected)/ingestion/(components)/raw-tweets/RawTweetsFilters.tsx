"use client";

import { Button } from "@/components/ui/button";
import { DatePickerNative } from "@/components/ui/date-picker-native";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { RawTweetsFilters } from "@/types/tweets";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

export type RawTweetsFiltersState = RawTweetsFilters;

interface RawTweetsFiltersProps {
  initial?: RawTweetsFiltersState;
  onChange: (filters: RawTweetsFiltersState) => void;
  availableCategories?: string[];
  availableTickers?: string[];
  availableSchedules?: { value: string; label: string }[];
}

export function RawTweetsFilters({
  initial,
  onChange,
  availableCategories = [],
  availableTickers = [],
  availableSchedules = [],
}: RawTweetsFiltersProps) {
  const [filters, setFilters] = useState<RawTweetsFiltersState>(initial || {});

  const categoryOptions = useMemo(
    () =>
      availableCategories.length > 0
        ? availableCategories
        : ["Earnings", "Product", "Partnership", "M&A", "Macro", "Other"],
    [availableCategories]
  );

  const scheduleOptions = useMemo(
    () =>
      availableSchedules.length > 0
        ? availableSchedules
        : [
            { value: "window-1d", label: "Window: 1 day" },
            { value: "window-7d", label: "Window: 7 days" },
            { value: "schedule-1", label: "Schedule: Service 03:00 IL" },
            { value: "schedule-2", label: "Schedule: Service 11:00 IL" },
            { value: "schedule-3", label: "Schedule: Service 14:00 IL" },
            { value: "schedule-4", label: "Schedule: Service 15:33 IL" },
          ],
    [availableSchedules]
  );

  const tickerOptions = useMemo(
    () =>
      availableTickers.length > 0
        ? availableTickers
        : ["AAPL", "MSFT", "NVDA", "AMZN", "TSLA", "GOOGL"],
    [availableTickers]
  );

  const apply = () => onChange(filters);
  const reset = () => {
    const cleared: RawTweetsFiltersState = {};
    setFilters(cleared);
    onChange(cleared);
  };

  return (
    <div className="w-full border border-border rounded-lg p-3 md:p-4 bg-muted/30">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
        {/* Row 1 */}
        <div className="md:col-span-2">
          <Select
            value={filters.categories?.[0] ?? ""}
            onValueChange={(v) =>
              setFilters((s) => ({ ...s, categories: v ? [v] : [] }))
            }
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Choose categories" />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search: Name"
              value={filters.name ?? ""}
              onChange={(e) =>
                setFilters((s) => ({ ...s, name: e.target.value }))
              }
              className="h-10 pl-9"
            />
          </div>
        </div>

        <div className="md:col-span-3 grid grid-cols-2 gap-2">
          <DatePickerNative
            value={filters.dateRange?.from}
            onChange={(d) =>
              setFilters((s) => ({
                ...s,
                dateRange: { from: d, to: s.dateRange?.to },
              }))
            }
            placeholder="Start date"
            className="h-10"
          />
          <DatePickerNative
            value={filters.dateRange?.to}
            onChange={(d) =>
              setFilters((s) => ({
                ...s,
                dateRange: { from: s.dateRange?.from, to: d },
              }))
            }
            placeholder="End date"
            className="h-10"
          />
        </div>

        {/* spacer to push actions to the right end of row 1 */}
        <div className="hidden md:block md:col-span-2" />

        <div className="md:col-span-2 flex gap-2 justify-end">
          <Button
            variant="ghost"
            className="h-10 w-full md:w-auto"
            onClick={reset}
          >
            Reset
          </Button>
          <Button className="h-10 w-full md:w-auto" onClick={apply}>
            Apply
          </Button>
        </div>

        {/* Row 2 */}
        <div className="md:col-span-2">
          <Select
            value={filters.ticker ?? ""}
            onValueChange={(v) =>
              setFilters((s) => ({ ...s, ticker: v || undefined }))
            }
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Choose ticker/symbol" />
            </SelectTrigger>
            <SelectContent>
              {tickerOptions.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-2">
          <Select
            value={filters.schedule ?? ""}
            onValueChange={(v) =>
              setFilters((s) => ({ ...s, schedule: v || undefined }))
            }
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Choose window/schedule" />
            </SelectTrigger>
            <SelectContent>
              {scheduleOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
