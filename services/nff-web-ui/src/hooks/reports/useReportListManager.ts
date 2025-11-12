import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useReports, useDeleteReport } from "@/hooks/api";
import { useExportPdf, useExportHtml } from "@/hooks/reports/useExports";
import { useToast } from "@/hooks/core";
import { useDebounce } from "@/hooks/ui";
import { ReportListFilters } from "@/types/reports";

export function useReportListManager() {
  const router = useRouter();
  const { showToast } = useToast();

  const [filters, setFilters] = useState<ReportListFilters>({
    page: 1,
    limit: 10,
    sortBy: "id",
    sortOrder: "desc",
  });

  const [searchValue, setSearchValue] = useState("");
  const [categoryValue, setCategoryValue] = useState("all");
  const [dateFromValue, setDateFromValue] = useState("");
  const [dateToValue, setDateToValue] = useState("");
  const [dateRangeError, setDateRangeError] = useState("");
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<number | null>(null);

  const debouncedSearch = useDebounce(searchValue, 400);

  const { data, isLoading, error, refetch } = useReports(filters);
  const { mutate: deleteReport } = useDeleteReport();
  const { mutate: exportPdf } = useExportPdf();
  const { mutate: exportHtml } = useExportHtml();

  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      setFilters((prev) => ({ ...prev, search: debouncedSearch, page: 1 }));
    }
  }, [debouncedSearch]);

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
  };

  const handleCategoryChange = (value: string) => {
    setCategoryValue(value);
    setFilters((prev) => ({
      ...prev,
      category: value === "all" ? undefined : value,
      page: 1,
    }));
  };

  const handleDateFromChange = (date: Date | undefined) => {
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
    setFilters((prev) => ({ ...prev, dateFrom: value, page: 1 }));
  };

  const handleDateToChange = (date: Date | undefined) => {
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
    setFilters((prev) => ({ ...prev, dateTo: value, page: 1 }));
  };

  const handleSort = (field: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: field,
      sortOrder:
        prev.sortBy === field && prev.sortOrder === "desc" ? "asc" : "desc",
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleEdit = (id: number) => {
    router.push(`/reports/${id}?mode=edit`);
  };

  const handleView = (id: number) => {
    router.push(`/reports/${id}?mode=preview`);
  };

  const handleDeleteClick = (id: number) => {
    setReportToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!reportToDelete) return;

    setIsDeletingId(reportToDelete);
    deleteReport(reportToDelete, {
      onSuccess: () => {
        showToast({
          type: "success",
          title: "Report Deleted!",
          description: "The report has been successfully deleted.",
          duration: 3000,
        });
        setDeleteDialogOpen(false);
        setReportToDelete(null);
        setIsDeletingId(null);
        refetch();
      },
      onError: (error) => {
        console.error("Failed to delete report:", error);
        showToast({
          type: "error",
          title: "Delete Failed",
          description: "Failed to delete the report. Please try again.",
          duration: 3000,
        });
        setIsDeletingId(null);
      },
    });
  };

  const handleExportPdf = (reportId: number) => {
    exportPdf(
      { reportId },
      {
        onSuccess: () => {
          showToast({
            type: "success",
            title: "Export Started",
            description: "Your PDF export is being processed.",
            duration: 3000,
          });
        },
        onError: (error) => {
          console.error("Failed to export PDF:", error);
          showToast({
            type: "error",
            title: "Export Failed",
            description: "Failed to export the report to PDF.",
            duration: 3000,
          });
        },
      }
    );
  };

  const handleExportHtml = (reportId: number) => {
    exportHtml(
      { reportId },
      {
        onSuccess: () => {
          showToast({
            type: "success",
            title: "Export Started",
            description: "Your HTML export is being processed.",
            duration: 3000,
          });
        },
        onError: (error) => {
          console.error("Failed to export HTML:", error);
          showToast({
            type: "error",
            title: "Export Failed",
            description: "Failed to export the report to HTML.",
            duration: 3000,
          });
        },
      }
    );
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = String(d.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  };

  return {
    reports: data?.data || [],
    total: data?.total || 0,
    currentPage: data?.page || 1,
    totalPages: data?.totalPages || 1,
    isLoading,
    error,

    searchValue,
    categoryValue,
    dateFromValue,
    dateToValue,
    dateRangeError,

    deleteDialogOpen,
    reportToDelete,
    isDeletingId,

    handleSearchChange,
    handleCategoryChange,
    handleDateFromChange,
    handleDateToChange,
    handleSort,
    handlePageChange,
    handleEdit,
    handleView,
    handleDeleteClick,
    handleDeleteConfirm,
    handleExportPdf,
    handleExportHtml,
    formatDate,
    refetch,
    setDeleteDialogOpen,
  };
}
