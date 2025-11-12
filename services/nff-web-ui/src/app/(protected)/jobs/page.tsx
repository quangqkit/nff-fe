"use client";

import {
  IndicatorLogDialog,
  JobsFilters,
  JobsTable,
} from "@/app/(protected)/jobs/(components)";
import { useJobs, usePagination, useSelection } from "@/hooks/api";
import { useDebounce } from "@/hooks/ui";
import { IndicatorLog, IndicatorLogStatus } from "@/types";
import { useState } from "react";

export default function JobsPage() {
  const [statusFilter, setStatusFilter] = useState<IndicatorLogStatus | "ALL">(
    "ALL"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const { currentPage, setCurrentPage } = usePagination({
    initialPage: 1,
    pageSize: 10,
  });

  const {
    selectedItems: selectedIds,
    toggleAll,
    toggleItem,
    selectedCount,
    setSelectedItems,
  } = useSelection<IndicatorLog>({
    getKey: (log) => log.indicatorId,
  });

  const [selectedLog, setSelectedLog] = useState<IndicatorLog | null>(null);

  const queryParams = {
    status: statusFilter === "ALL" ? undefined : statusFilter,
    search: debouncedSearchQuery || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    page: currentPage,
    limit: 10,
  };

  const { logs, loading, totalPages, retryMultiple, retrying, refresh, error } =
    useJobs(queryParams);

  const handleSelectAll = () => {
    toggleAll(logs);
  };

  const handleSelectOne = (indicatorId: number) => {
    const log = logs.find((l: IndicatorLog) => l.indicatorId === indicatorId);
    if (log) {
      toggleItem(log);
    }
  };

  const handleRetrySelected = () => {
    if (selectedIds.length === 0) {
      return;
    }
    retryMultiple(selectedIds as number[]);
    setSelectedItems([]);
  };

  const handleViewDetail = (log: IndicatorLog) => {
    setSelectedLog(log);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive mb-2">Failed to load jobs</p>
          <button onClick={refresh} className="text-primary hover:underline">
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      <div className="bg-card rounded-lg shadow border border-border">
        <JobsFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          startDate={startDate}
          onStartDateChange={setStartDate}
          endDate={endDate}
          onEndDateChange={setEndDate}
          onRefresh={refresh}
          loading={loading}
          selectedCount={selectedCount}
          onRetrySelected={handleRetrySelected}
          retrying={retrying}
        />

        <JobsTable
          logs={logs}
          loading={loading}
          currentPage={currentPage}
          totalPages={totalPages}
          selectedIds={selectedIds as number[]}
          onPageChange={setCurrentPage}
          onSelectAll={handleSelectAll}
          onSelectOne={handleSelectOne}
          onViewDetail={handleViewDetail}
        />
      </div>

      <IndicatorLogDialog
        log={selectedLog}
        open={!!selectedLog}
        onClose={() => setSelectedLog(null)}
      />
    </div>
  );
}
