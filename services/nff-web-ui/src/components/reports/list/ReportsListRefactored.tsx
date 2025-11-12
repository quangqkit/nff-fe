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
import { Card, CardContent } from "@/components/ui/card";
import { useReportListManager } from "@/hooks/reports";
import { ReportsFilters } from "./ReportsFilters";
import { ReportsTable } from "./ReportsTable";
import { ReportsPagination } from "./ReportsPagination";

interface ReportsListRefactoredProps {
  className?: string;
}

export function ReportsListRefactored({
  className,
}: ReportsListRefactoredProps) {
  const {
    reports,
    total,
    currentPage,
    totalPages,
    isLoading,

    searchValue,
    categoryValue,
    dateFromValue,
    dateToValue,
    dateRangeError,

    deleteDialogOpen,
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
  } = useReportListManager();

  return (
    <div className={className}>
      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-2xl font-bold">Reports</h2>
            <div className="text-sm text-muted-foreground">
              {total} report{total !== 1 ? "s" : ""} found
            </div>
          </div>

          <ReportsFilters
            searchValue={searchValue}
            categoryValue={categoryValue}
            dateFromValue={dateFromValue}
            dateToValue={dateToValue}
            dateRangeError={dateRangeError}
            onSearchChange={handleSearchChange}
            onCategoryChange={handleCategoryChange}
            onDateFromChange={handleDateFromChange}
            onDateToChange={handleDateToChange}
            onRefresh={refetch}
          />

          <ReportsTable
            reports={reports}
            isLoading={isLoading}
            isDeletingId={isDeletingId}
            onSort={handleSort}
            onEdit={handleEdit}
            onView={handleView}
            onDelete={handleDeleteClick}
            onExportPdf={handleExportPdf}
            onExportHtml={handleExportHtml}
            formatDate={formatDate}
          />

          <ReportsPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              report and all its associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
