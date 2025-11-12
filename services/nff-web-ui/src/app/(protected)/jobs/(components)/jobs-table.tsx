"use client";

import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTable, Column } from "@/components/ui/data-table";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Eye, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { INDICATOR_STATUS_COLORS, INDICATOR_STATUS_LABELS } from "@/constants/indicator-log.constants";
import { cn } from "@/lib/utils";
import { IndicatorLog } from "@/types";

export interface JobsTableProps {
  logs: IndicatorLog[];
  loading?: boolean;
  currentPage: number;
  totalPages: number;
  selectedIds: number[];
  onPageChange: (page: number) => void;
  onSelectAll: () => void;
  onSelectOne: (indicatorId: number) => void;
  onViewDetail: (log: IndicatorLog) => void;
}

export function JobsTable({
  logs,
  loading = false,
  currentPage,
  totalPages,
  selectedIds,
  onPageChange,
  onSelectAll,
  onSelectOne,
  onViewDetail,
}: JobsTableProps) {
  const columns: Column<IndicatorLog>[] = [
    {
      key: "select",
      header: (
        <Checkbox
          checked={selectedIds.length === logs.length && logs.length > 0}
          onCheckedChange={onSelectAll}
        />
      ),
      width: "12",
      render: (log) => (
        <Checkbox
          checked={selectedIds.includes(log.indicatorId)}
          onCheckedChange={() => onSelectOne(log.indicatorId)}
        />
      ),
    },
    {
      key: "indicatorName",
      header: "Indicator Name",
      render: (log) => (
        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
          {log.indicatorName}
        </div>
      ),
    },
    {
      key: "categoryName",
      header: "Category",
      render: (log) => (
        <Badge variant="outline" className="text-xs">
          {log.categoryName}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (log) => (
        <Badge
          className={cn(
            "text-xs",
            INDICATOR_STATUS_COLORS[log.status]
          )}
        >
          {INDICATOR_STATUS_LABELS[log.status]}
        </Badge>
      ),
    },
    {
      key: "records",
      header: "Records",
      render: (log) => (
        <div className="text-sm text-slate-700 dark:text-slate-300">
          {log.recordsInserted} / {log.recordsProcessed}
        </div>
      ),
    },
    {
      key: "createdAt",
      header: "Created",
      render: (log) => {
        const formatDate = (dateStr: string) => {
          return new Date(dateStr).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
        };
        return (
          <span className="text-sm text-slate-600 dark:text-slate-400">
            {formatDate(log.createdAt)}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (log) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="hover:cursor-pointer"
              onClick={() => onViewDetail(log)}
            >
              <Eye className="h-4 w-4 mr-2" />
              View Detail
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <DataTable
        data={logs}
        columns={columns}
        loading={loading}
        emptyMessage="No jobs found"
        emptyIcon={
          <svg
            className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        }
        rowClassName={(log) => 
          selectedIds.includes(log.indicatorId) 
            ? "bg-blue-50 dark:bg-blue-900/20" 
            : ""
        }
        className=""
      />

      {totalPages > 1 && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
}

export default JobsTable;
