import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  Edit,
  Eye,
  Trash2,
  Download,
  FileText,
  Loader2,
} from 'lucide-react';
import { ReportListItem } from '@/types';

interface ReportRowActionsProps {
  report: ReportListItem;
  isDeleting: boolean;
  onEdit: () => void;
  onView: () => void;
  onDelete: () => void;
  onExportPdf: () => void;
  onExportHtml: () => void;
}

export function ReportRowActions({
  report,
  isDeleting,
  onEdit,
  onView,
  onDelete,
  onExportPdf,
  onExportHtml,
}: ReportRowActionsProps) {
  if (isDeleting) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onEdit}>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onView}>
          <Eye className="mr-2 h-4 w-4" />
          View
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onExportPdf}>
          <Download className="mr-2 h-4 w-4" />
          Export PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onExportHtml}>
          <FileText className="mr-2 h-4 w-4" />
          Export HTML
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDelete} className="text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}



