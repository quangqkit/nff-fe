import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Edit,
  Trash2,
  Plus,
  MoreHorizontal,
  Copy,
  Eye,
  EyeOff,
} from 'lucide-react';
import type { ReportSection } from '@/types/reports';

interface SectionCardProps {
  section: ReportSection;
  isEnabled: boolean;
  isEditing: boolean;
  onTitleChange: (newTitle: string) => void;
  onTitleSave: () => void;
  onTitleCancel: () => void;
  onStartEdit: () => void;
  onToggleVisibility: () => void;
  onAddChart: () => void;
  onAddBlock: () => void;
  onDelete: () => void;
  onDuplicate?: () => void;
  children?: React.ReactNode;
}

export function SectionCard({
  section,
  isEnabled,
  isEditing,
  onTitleChange,
  onTitleSave,
  onTitleCancel,
  onStartEdit,
  onToggleVisibility,
  onAddChart,
  onAddBlock,
  onDelete,
  onDuplicate,
  children,
}: SectionCardProps) {
  const [localTitle, setLocalTitle] = useState(section.title);

  const handleTitleChange = (value: string) => {
    setLocalTitle(value);
    onTitleChange(value);
  };

  return (
    <Card
      className={`mb-4 border-0 shadow-none ${!isEnabled ? "opacity-60" : ""}`}
    >
      <CardContent className="!p-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 flex-1">
            {isEditing ? (
              <div className="flex items-center gap-2 flex-1">
                <Input
                  value={localTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="font-semibold"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onTitleSave();
                    if (e.key === "Escape") onTitleCancel();
                  }}
                  autoFocus
                />
                <Button size="sm" onClick={onTitleSave}>
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={onTitleCancel}>
                  Cancel
                </Button>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-semibold !text-[#707FDD]">
                  {section.title}
                </h3>
                <Button size="sm" variant="ghost" onClick={onStartEdit}>
                  <Edit className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {section.blocks?.length ?? 0} blocks
            </Badge>

            <div className="flex items-center gap-2">
              <Switch
                checked={isEnabled}
                onCheckedChange={onToggleVisibility}
              />
              {isEnabled ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onAddChart}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Chart
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onAddBlock}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Block
                </DropdownMenuItem>
                {onDuplicate && (
                  <DropdownMenuItem onClick={onDuplicate}>
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicate Section
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Section
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="space-y-4">{children}</div>
      </CardContent>
    </Card>
  );
}



