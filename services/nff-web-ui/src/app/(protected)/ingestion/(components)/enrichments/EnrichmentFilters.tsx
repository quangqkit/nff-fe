"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePickerNative } from "@/components/ui/date-picker-native";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import { DateRange } from "react-day-picker";

export type EnrichmentFiltersState = {
  categories: string[];
  tickers: string[];
  name?: string;
  schedule?: string;
  dateRange?: DateRange;
};

export function EnrichmentFilters({
  initial,
  onChange,
}: {
  initial?: EnrichmentFiltersState;
  onChange: (next: EnrichmentFiltersState) => void;
}) {
  const [filters, setFilters] = useState<EnrichmentFiltersState>(
    initial || { categories: [], tickers: [] }
  );

  const scheduleOptions = useMemo(
    () => [
      { value: "window-1d", label: "Window: 1 day" },
      { value: "window-7d", label: "Window: 7 days" },
      { value: "earnings", label: "Schedule: Earnings" },
      { value: "events", label: "Schedule: Events" },
    ],
    []
  );

  const categoryOptions = useMemo(
    () => ["Finances", "Economic", "Gold/ETF"],
    []
  );

  const tickerOptions = useMemo(
    () => [
      { code: "FMC", name: "EMC Corp" },
      { code: "SFM", name: "Sprouts F" },
      { code: "CMG", name: "Chipotle M" },
      { code: "EBAY", name: "eBay Inc" },
      { code: "AAPL", name: "Apple Inc" },
      { code: "MSFT", name: "Microsoft Corp" },
      { code: "NVDA", name: "NVIDIA Corp" },
      { code: "AMZN", name: "Amazon.com Inc" },
      { code: "TSLA", name: "Tesla Inc" },
    ],
    []
  );

  const apply = () => onChange(filters);
  const reset = () => {
    const cleared: EnrichmentFiltersState = { categories: [], tickers: [] };
    setFilters(cleared);
    onChange(cleared);
  };

  return (
    <div className="w-full border border-border rounded-lg p-3 md:p-4 bg-muted/30">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
        <div className="md:col-span-2">
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-left font-normal ring-offset-background focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
                  !filters.categories.length && "text-muted-foreground"
                )}
              >
                <span className="flex-1 truncate">
                  {filters.categories.length > 0
                    ? filters.categories.length === categoryOptions.length
                      ? "All categories"
                      : filters.categories.join(", ")
                    : "Choose categories"}
                </span>
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-2" align="start">
              <div className="space-y-2">
                {categoryOptions.map((category) => (
                  <div
                    key={category}
                    className="flex items-center space-x-2 rounded-sm px-2 py-1.5 hover:bg-accent cursor-pointer"
                    onClick={() => {
                      setFilters((s) => {
                        const newCategories = s.categories.includes(category)
                          ? s.categories.filter((c) => c !== category)
                          : [...s.categories, category];
                        return { ...s, categories: newCategories };
                      });
                    }}
                  >
                    <Checkbox
                      checked={filters.categories.includes(category)}
                      onCheckedChange={(checked) => {
                        setFilters((s) => {
                          if (checked) {
                            return {
                              ...s,
                              categories: [...s.categories, category],
                            };
                          } else {
                            return {
                              ...s,
                              categories: s.categories.filter(
                                (c) => c !== category
                              ),
                            };
                          }
                        });
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <label
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {category}
                    </label>
                  </div>
                ))}
                <div className="border-t pt-2 mt-2">
                  <div
                    className="flex items-center space-x-2 rounded-sm px-2 py-1.5 hover:bg-accent cursor-pointer"
                    onClick={() => {
                      setFilters((s) => ({
                        ...s,
                        categories:
                          s.categories.length === categoryOptions.length
                            ? []
                            : [...categoryOptions],
                      }));
                    }}
                  >
                    <Checkbox
                      checked={
                        filters.categories.length === categoryOptions.length
                      }
                      onCheckedChange={(checked) => {
                        setFilters((s) => ({
                          ...s,
                          categories: checked ? [...categoryOptions] : [],
                        }));
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <label
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Select All
                    </label>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="md:col-span-3">
          <Input
            placeholder="Search: Name"
            value={filters.name ?? ""}
            onChange={(e) =>
              setFilters((s) => ({ ...s, name: e.target.value }))
            }
            className="h-10"
          />
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
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-left font-normal ring-offset-background focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
                  !filters.tickers.length && "text-muted-foreground"
                )}
              >
                <span className="flex-1 truncate">
                  {filters.tickers.length > 0
                    ? filters.tickers.length === tickerOptions.length
                      ? "All tickers"
                      : filters.tickers.join(", ")
                    : "Choose ticker"}
                </span>
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[300px] p-2 max-h-[300px] overflow-y-auto"
              align="start"
            >
              <div className="space-y-2">
                {tickerOptions.map((ticker) => (
                  <div
                    key={ticker.code}
                    className="flex items-center space-x-2 rounded-sm px-2 py-1.5 hover:bg-accent cursor-pointer"
                    onClick={() => {
                      setFilters((s) => {
                        const newTickers = s.tickers.includes(ticker.code)
                          ? s.tickers.filter((t) => t !== ticker.code)
                          : [...s.tickers, ticker.code];
                        return { ...s, tickers: newTickers };
                      });
                    }}
                  >
                    <Checkbox
                      checked={filters.tickers.includes(ticker.code)}
                      onCheckedChange={(checked) => {
                        setFilters((s) => {
                          if (checked) {
                            return {
                              ...s,
                              tickers: [...s.tickers, ticker.code],
                            };
                          } else {
                            return {
                              ...s,
                              tickers: s.tickers.filter(
                                (t) => t !== ticker.code
                              ),
                            };
                          }
                        });
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <label
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {ticker.code} - {ticker.name}
                    </label>
                  </div>
                ))}
                <div className="border-t pt-2 mt-2">
                  <div
                    className="flex items-center space-x-2 rounded-sm px-2 py-1.5 hover:bg-accent cursor-pointer"
                    onClick={() => {
                      setFilters((s) => ({
                        ...s,
                        tickers:
                          s.tickers.length === tickerOptions.length
                            ? []
                            : tickerOptions.map((t) => t.code),
                      }));
                    }}
                  >
                    <Checkbox
                      checked={filters.tickers.length === tickerOptions.length}
                      onCheckedChange={(checked) => {
                        setFilters((s) => ({
                          ...s,
                          tickers: checked
                            ? tickerOptions.map((t) => t.code)
                            : [],
                        }));
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <label
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Select All
                    </label>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
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
