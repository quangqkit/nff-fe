import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Edit, Trash2, MoreHorizontal } from 'lucide-react';
import type { ReportBlock } from '@/types/reports';

interface BlockItemProps {
  block: ReportBlock;
  onEdit: () => void;
  onDelete: () => void;
  children?: React.ReactNode;
}

export function BlockItem({ block, onEdit, onDelete, children }: BlockItemProps) {
  const getBlockTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      text: 'Text',
      table: 'Table',
      list: 'List',
      note: 'Note',
      chart: 'Chart',
    };
    return labels[type] || type;
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h4 className="font-medium">{block.name}</h4>
          <Badge variant="outline">{getBlockTypeLabel(block.type)}</Badge>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Block
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Block
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {children && <div className="mt-4">{children}</div>}
    </Card>
  );
}



