import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Edit, Trash2, Download, MoreHorizontal } from 'lucide-react';
import type { ChartData } from '@/types';

interface ChartItemProps {
  chart: ChartData;
  onEdit: () => void;
  onDelete: () => void;
  onExport?: () => void;
  children?: React.ReactNode;
}

export function ChartItem({
  chart,
  onEdit,
  onDelete,
  onExport,
  children,
}: ChartItemProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium">{chart.title ?? 'Untitled Chart'}</h4>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Chart
            </DropdownMenuItem>
            {onExport && (
              <DropdownMenuItem onClick={onExport}>
                <Download className="mr-2 h-4 w-4" />
                Export JSON
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Chart
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-4">{children}</div>
    </Card>
  );
}



