"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DatePickerNative } from "@/components/ui/date-picker-native";
import { DownloadOverlay } from "@/components/ui/download-overlay";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDebounce } from "@/hooks/ui";
import { useToast } from "@/hooks/core";
import {
  useReports,
  useDeleteReport,
  useExportReport,
} from "@/hooks/api/useReportList";
import { useExportPdf, useExportHtml } from "@/hooks/reports/useExports";
import { ReportListItem, ReportListFilters } from "@/types";
import {
  Calendar,
  Download,
  Edit,
  ExternalLink,
  Eye,
  FileText,
  MoreHorizontal,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

interface ReportsListProps {
  className?: string;
}

const useReportFilters = () => {
  const [filters, setFilters] = useState<ReportListFilters>({
    page: 1,
    limit: 10,
    search: "",
    category: undefined,
    dateFrom: undefined,
    dateTo: undefined,
    sortBy: "updatedAt",
    sortOrder: "desc",
  });

  const updateFilters = useCallback(
    (newFilters: Partial<ReportListFilters>) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
    },
    []
  );

  const resetFilters = useCallback(() => {
    setFilters({
      page: 1,
      limit: 10,
      search: "",
      category: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      sortBy: "updatedAt",
      sortOrder: "desc",
    });
  }, []);

  return {
    filters,
    updateFilters,
    resetFilters,
  };
};

const useExportState = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState<
    "idle" | "processing" | "downloading" | "completed" | "error"
  >("idle");
  const [exportMessage, setExportMessage] = useState("");

  const startExport = useCallback(() => {
    setIsExporting(true);
    setExportProgress(0);
    setExportStatus("processing");
    setExportMessage("Preparing export...");
  }, []);

  const updateProgress = useCallback((progress: number, message: string) => {
    setExportProgress(progress);
    setExportMessage(message);
  }, []);

  const completeExport = useCallback(() => {
    setExportProgress(100);
    setExportStatus("completed");
    setExportMessage("Download started");
    setTimeout(() => {
      setIsExporting(false);
      setExportStatus("idle");
    }, 2000);
  }, []);

  const failExport = useCallback((error: string) => {
    setExportStatus("error");
    setExportMessage(error);
    setTimeout(() => {
      setIsExporting(false);
      setExportStatus("idle");
    }, 3000);
  }, []);

  return {
    isExporting,
    exportProgress,
    exportStatus,
    exportMessage,
    startExport,
    updateProgress,
    completeExport,
    failExport,
  };
};

export function ReportsList({ className }: ReportsListProps) {
  const { filters, updateFilters, resetFilters } = useReportFilters();

  const {
    isExporting,
    exportProgress,
    exportStatus,
    exportMessage,
    startExport,
    updateProgress,
    completeExport,
    failExport,
  } = useExportState();

  const [searchValue, setSearchValue] = useState("");
  const [categoryValue, setCategoryValue] = useState("all");
  const [dateFromValue, setDateFromValue] = useState("");
  const [dateToValue, setDateToValue] = useState("");
  const [dateRangeError, setDateRangeError] = useState<string>("");

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<number | null>(null);

  const { showToast } = useToast();
  const debouncedSearch = useDebounce(searchValue, 400);

  const { data: reportsData, isLoading, error, refetch } = useReports(filters);

  const deleteReportMutation = useDeleteReport();
  const exportPdfMutation = useExportPdf();
  const exportHtmlMutation = useExportHtml();

  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      updateFilters({ search: debouncedSearch, page: 1 });
    }
  }, [debouncedSearch, filters.search, updateFilters]);

  const reports = useMemo(() => reportsData?.data || [], [reportsData?.data]);
  const pagination = useMemo(
    () => reportsData?.pagination,
    [reportsData?.pagination]
  );
  const availableCategories = useMemo(
    () => reportsData?.filters?.available?.categories || [],
    [reportsData?.filters?.available?.categories]
  );

  const handleCategoryFilter = useCallback(
    (value: string) => {
      setCategoryValue(value);
      updateFilters({
        category: value === "all" ? undefined : value,
        page: 1,
      });
    },
    [updateFilters]
  );

  const handleDateFromFilter = useCallback(
    (date: Date | undefined) => {
      const value = date ? date.toISOString().split("T")[0] : "";
      setDateFromValue(value);

      if (value && dateToValue) {
        const fromDate = new Date(value);
        const toDate = new Date(dateToValue);
        if (fromDate >= toDate) {
          setDateRangeError("From date must be before To date");
          return;
        }
      }
      setDateRangeError("");
      updateFilters({ dateFrom: value, page: 1 });
    },
    [dateToValue, updateFilters]
  );

  const handleDateToFilter = useCallback(
    (date: Date | undefined) => {
      const value = date ? date.toISOString().split("T")[0] : "";
      setDateToValue(value);

      if (value && dateFromValue) {
        const fromDate = new Date(dateFromValue);
        const toDate = new Date(value);
        if (toDate <= fromDate) {
          setDateRangeError("To date must be after From date");
          return;
        }
      }
      setDateRangeError("");
      updateFilters({ dateTo: value, page: 1 });
    },
    [dateFromValue, updateFilters]
  );

  const handleSort = useCallback(
    (field: string) => {
      const newOrder =
        filters.sortBy === field && filters.sortOrder === "desc"
          ? "asc"
          : "desc";
      updateFilters({ sortBy: field, sortOrder: newOrder, page: 1 });
    },
    [filters.sortBy, filters.sortOrder, updateFilters]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      updateFilters({ page });
    },
    [updateFilters]
  );

  const formatDate = useCallback((date: Date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = String(d.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  }, []);

  const handleDeleteClick = useCallback((reportId: number) => {
    setReportToDelete(reportId);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!reportToDelete) return;

    try {
      await deleteReportMutation.mutateAsync(reportToDelete);

      showToast({
        type: "success",
        title: "Report Deleted!",
        description: "The report has been successfully deleted.",
        duration: 3000,
      });

      await refetch();
    } catch (error) {
      console.error("Failed to delete report:", error);
      showToast({
        type: "error",
        title: "Delete Failed",
        description: "Failed to delete the report. Please try again.",
        duration: 3000,
      });
    } finally {
      setDeleteDialogOpen(false);
      setReportToDelete(null);
    }
  }, [reportToDelete, deleteReportMutation, showToast, refetch]);

  const handleAction = useCallback(
    async (action: string, reportId: number) => {
      switch (action) {
        case "preview":
          window.location.href = `/reports/${reportId}?mode=preview`;
          break;
        case "edit":
          window.location.href = `/reports/${reportId}?mode=edit`;
          break;
        case "export-pdf":
          await handleExportReport(reportId, "pdf");
          break;
        case "export-html":
          await handleExportReport(reportId, "html");
          break;
        case "re-generate":
          break;
        case "delete":
          handleDeleteClick(reportId);
          break;
        default:
      }
    },
    [handleDeleteClick]
  );

  const handleExportReport = useCallback(
    async (reportId: number, exportType: "pdf" | "html") => {
      try {
        startExport();
        updateProgress(10, `Starting ${exportType.toUpperCase()} export...`);

        const mutation =
          exportType === "pdf" ? exportPdfMutation : exportHtmlMutation;

        updateProgress(30, "Processing export...");

        const result = await mutation.mutateAsync({
          reportId,
          config: {
            includeCharts: true,
            includeImages: true,
          },
        });

        updateProgress(70, "Finalizing export...");

        if (result.success && result.data) {
          updateProgress(90, "Preparing download...");

          if (result.data.downloadUrl) {
            updateProgress(100, "Download starting...");
            window.open(result.data.downloadUrl, "_blank");
            completeExport();
          } else {
            failExport("Export completed but no download URL provided");
          }
        } else {
          throw new Error(result.message || "Export failed");
        }
      } catch (error) {
        console.error("Export error:", error);
        failExport(
          error instanceof Error ? error.message : "Failed to export report"
        );

        showToast({
          type: "error",
          title: "Export Failed",
          description:
            error instanceof Error ? error.message : "Failed to export report",
          duration: 4000,
        });
      }
    },
    [
      startExport,
      updateProgress,
      completeExport,
      failExport,
      exportPdfMutation,
      exportHtmlMutation,
      showToast,
    ]
  );

  const isDeleting = deleteReportMutation.isPending;

  const TableSkeleton = () => (
    <>
      {Array.from({ length: 6 }).map((_, index) => (
        <TableRow key={index} className="animate-pulse">
          <TableCell>
            <Skeleton className="h-4 w-12 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200" />
          </TableCell>
          <TableCell>
            <div className="space-y-2">
              <Skeleton className="h-4 w-48 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-3 w-3 rounded-full bg-blue-200" />
                <Skeleton className="h-3 w-20 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200" />
                <Skeleton className="h-4 w-12 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200" />
              </div>
            </div>
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-16 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-16 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-20 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-8 w-8 rounded bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );

  const renderPagination = useCallback(() => {
    if (!pagination) return null;

    const { page, totalPages, hasNext, hasPrev } = pagination;
    const pages = [];

    const startPage = Math.max(1, page - 2);
    const endPage = Math.min(totalPages, page + 2);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (hasPrev) handlePageChange(page - 1);
              }}
              className={!hasPrev ? "pointer-events-none opacity-50" : ""}
              size="sm"
            />
          </PaginationItem>

          {startPage > 1 && (
            <>
              <PaginationItem>
                <PaginationLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (page !== 1) handlePageChange(1);
                  }}
                  isActive={page === 1}
                  className={page === 1 ? "pointer-events-none" : ""}
                  size="sm"
                >
                  1
                </PaginationLink>
              </PaginationItem>
              {startPage > 2 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
            </>
          )}

          {pages.map((pageNum) => (
            <PaginationItem key={pageNum}>
              <PaginationLink
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (pageNum !== page) handlePageChange(pageNum);
                }}
                isActive={pageNum === page}
                className={pageNum === page ? "pointer-events-none" : ""}
                size="sm"
              >
                {pageNum}
              </PaginationLink>
            </PaginationItem>
          ))}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
              <PaginationItem>
                <PaginationLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (page !== totalPages) handlePageChange(totalPages);
                  }}
                  isActive={page === totalPages}
                  className={page === totalPages ? "pointer-events-none" : ""}
                  size="sm"
                >
                  {totalPages}
                </PaginationLink>
              </PaginationItem>
            </>
          )}

          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (hasNext) handlePageChange(page + 1);
              }}
              className={!hasNext ? "pointer-events-none opacity-50" : ""}
              size="sm"
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  }, [pagination, handlePageChange]);

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Error: {error.message}</p>
            <Button onClick={() => refetch()} className="mt-2">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`h-full flex flex-col space-y-4 pb-6 ${className}`}>
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground font-medium">
                  Search
                </span>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name..."
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-muted-foreground font-medium">
                  Category
                </span>
                <Select
                  value={categoryValue}
                  onValueChange={handleCategoryFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {availableCategories.map((category: string) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-muted-foreground font-medium">
                  From
                </span>
                <DatePickerNative
                  placeholder="From date"
                  value={
                    dateFromValue && dateFromValue !== ""
                      ? new Date(dateFromValue)
                      : undefined
                  }
                  onChange={handleDateFromFilter}
                  className="w-full"
                />
              </div>

              <div className="space-y-1">
                <span className="text-xs text-muted-foreground font-medium">
                  To
                </span>
                <DatePickerNative
                  placeholder="To date"
                  value={
                    dateToValue && dateToValue !== ""
                      ? new Date(dateToValue)
                      : undefined
                  }
                  onChange={handleDateToFilter}
                  min={dateFromValue || undefined}
                  className="w-full"
                />
              </div>
            </div>

            {dateRangeError && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <p className="text-sm text-red-700 font-medium">
                  {dateRangeError}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="flex-1 flex flex-col min-h-0">
        <CardContent className="p-0 flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto min-h-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("id")}
                  >
                    <div className="flex items-center gap-2">
                      ID
                      {filters.sortBy === "id" && (
                        <span className="text-xs">
                          {filters.sortOrder === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("title")}
                  >
                    <div className="flex items-center gap-2">
                      Name of reports
                      {filters.sortBy === "title" && (
                        <span className="text-xs">
                          {filters.sortOrder === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead>HTML file</TableHead>
                  <TableHead>Google Slides URL</TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("updatedAt")}
                  >
                    <div className="flex items-center gap-2">
                      Last updated
                      {filters.sortBy === "updatedAt" && (
                        <span className="text-xs">
                          {filters.sortOrder === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableSkeleton />
                ) : reports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-[400px]">
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <FileText className="h-20 w-20 text-muted-foreground mb-4" />
                        <h3 className="text-xl font-semibold text-foreground mb-2">
                          No data available
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          No reports found matching your criteria
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  reports.map((report: ReportListItem) => (
                    <TableRow key={report.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="font-medium text-foreground">
                          {report.id}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{report.title}</div>
                          <div className="flex items-center gap-2 mt-2"></div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {report.htmlFileUrl ? (
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 h-auto"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-400 text-sm">
                              No HTML file
                            </span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {report.googleSlidesUrl ? (
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 h-auto"
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Open
                          </Button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <ExternalLink className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-400 text-sm">
                              No slides
                            </span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="h-3 w-3" />
                          {formatDate(report.lastUpdated)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="hover:cursor-pointer"
                              onClick={() => handleAction("preview", report.id)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Preview
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="hover:cursor-pointer"
                              onClick={() => handleAction("edit", report.id)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleAction("delete", report.id)}
                              className="text-red-600 hover:cursor-pointer"
                              disabled={isDeleting}
                            >
                              {isDeleting ? (
                                <>
                                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                  Deleting...
                                </>
                              ) : (
                                <>
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {pagination && (
            <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t gap-4">
              <div className="flex items-center gap-1">
                <p className="text-xs text-gray-500 w-fit">
                  {pagination.total}
                </p>
                <p className="text-xs text-gray-500 w-fit">
                  {" "}
                  {pagination.total > 1 ? "results" : "result"}
                </p>
              </div>
              {renderPagination()}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              report and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting !== null}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DownloadOverlay
        isVisible={isExporting}
        progress={exportProgress}
        status={exportStatus === "idle" ? "processing" : exportStatus}
        message={exportMessage}
      />
    </div>
  );
}
