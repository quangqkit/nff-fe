"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { IndicatorLogStatus } from "@/types";

export interface JobsFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: IndicatorLogStatus | "ALL";
  onStatusChange: (value: IndicatorLogStatus | "ALL") => void;
  startDate: string;
  onStartDateChange: (value: string) => void;
  endDate: string;
  onEndDateChange: (value: string) => void;
  onRefresh: () => void;
  loading?: boolean;
  selectedCount?: number;
  onRetrySelected?: () => void;
  retrying?: boolean;
}

export function JobsFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  onRefresh,
  loading = false,
  selectedCount = 0,
  onRetrySelected,
  retrying = false,
}: JobsFiltersProps) {
  return (
    <div className="p-4 border-b border-border">
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label className="block text-xs font-medium text-foreground mb-1.5">
            Search
          </label>
          <input
            type="text"
            placeholder="Search by ID or name..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            max={endDate || undefined}
            placeholder="Start date"
            className="px-3 py-2 border border-input rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            min={startDate || undefined}
            placeholder="End date"
            className="px-3 py-2 border border-input rounded-lg text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-foreground mb-1.5">
            Status
          </label>
          <Select
            value={statusFilter}
            onValueChange={(val) =>
              onStatusChange(val as IndicatorLogStatus | "ALL")
            }
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              <SelectItem value="OK">Success</SelectItem>
              <SelectItem value="ERROR">Error</SelectItem>
              <SelectItem value="PROCESSING">Processing</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="BLOCKED">Blocked</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {selectedCount > 0 && onRetrySelected && (
          <Button
            onClick={onRetrySelected}
            disabled={retrying}
            variant="default"
            className="h-[42px] px-3 py-2"
          >
            <RefreshCw
              className={cn("h-4 w-4 mr-2", retrying && "animate-spin")}
            />
            Retry ({selectedCount})
          </Button>
        )}

        <Button
          onClick={onRefresh}
          variant="outline"
          disabled={loading}
          className="h-[42px] px-3 py-2"
        >
          <RefreshCw
            className={cn("h-4 w-4 mr-2", loading && "animate-spin")}
          />
          Refresh
        </Button>
      </div>
    </div>
  );
}

export default JobsFilters;
