import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ReportRowActions } from './ReportRowActions';
import type { ReportListItem } from '@/types';

interface ReportsTableProps {
  reports: ReportListItem[];
  isLoading: boolean;
  isDeletingId: number | null;
  onSort: (field: string) => void;
  onEdit: (id: number) => void;
  onView: (id: number) => void;
  onDelete: (id: number) => void;
  onExportPdf: (id: number) => void;
  onExportHtml: (id: number) => void;
  formatDate: (date: Date) => string;
}

export function ReportsTable({
  reports,
  isLoading,
  isDeletingId,
  onSort,
  onEdit,
  onView,
  onDelete,
  onExportPdf,
  onExportHtml,
  formatDate,
}: ReportsTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg">No reports found</p>
        <p className="text-sm">Try adjusting your filters or create a new report</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>
            <Button variant="ghost" onClick={() => onSort('title')}>
              Title
            </Button>
          </TableHead>
          <TableHead>
            <Button variant="ghost" onClick={() => onSort('reportType')}>
              Type
            </Button>
          </TableHead>
          <TableHead>
            <Button variant="ghost" onClick={() => onSort('createdAt')}>
              Created
            </Button>
          </TableHead>
          <TableHead>
            <Button variant="ghost" onClick={() => onSort('updatedAt')}>
              Updated
            </Button>
          </TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reports.map((report) => (
          <TableRow key={report.id}>
            <TableCell className="font-medium">{report.title}</TableCell>
            <TableCell>{report.reportType?.name || 'N/A'}</TableCell>
            <TableCell>{formatDate(new Date(report.createdAt))}</TableCell>
            <TableCell>{formatDate(new Date(report.updatedAt))}</TableCell>
            <TableCell className="text-right">
              <ReportRowActions
                report={report}
                isDeleting={isDeletingId === report.id}
                onEdit={() => onEdit(report.id)}
                onView={() => onView(report.id)}
                onDelete={() => onDelete(report.id)}
                onExportPdf={() => onExportPdf(report.id)}
                onExportHtml={() => onExportHtml(report.id)}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}



