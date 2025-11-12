import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BlockData, ChartData } from "@/types";
import { ReportBlock } from "@/types/reports";
import { REPORT_UI_TEXT, REPORT_BLOCK_TYPES } from "@/constants/reports";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  Download,
  Eye,
  EyeOff,
} from "lucide-react";

interface BlockTableProps {
  blocks: (BlockData | ChartData)[];
  onToggleBlock: (blockId: number) => void;
  onEditBlock: (block: BlockData) => void;
  onDuplicateBlock: (block: ReportBlock) => void;
  onDeleteBlock: (blockId: number) => void;
  onExportChartJson: (chart: ChartData) => void;
  isPreviewMode?: boolean;
}

export const BlockTable = ({
  blocks,
  onToggleBlock,
  onEditBlock,
  onDuplicateBlock,
  onDeleteBlock,
  onExportChartJson,
  isPreviewMode = false,
}: BlockTableProps) => {
  const formatBlockType = (type: string) => {
    return REPORT_BLOCK_TYPES[type as keyof typeof REPORT_BLOCK_TYPES] || type;
  };

  const getBadgeClassName = () => {
    return "bg-[#f0f2ff] text-[#707FDD] border-[#c7d2fe] hover:bg-[#e0e7ff]";
  };

  const uniqueBlocks = blocks.filter(
    (block, index, self) =>
      self.findIndex((b) => "id" in b && "id" in block && b.id === block.id) ===
      index
  ) as BlockData[];

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      <table className="w-full">
        <thead className="bg-muted">
          <tr>
            <th className="px-4 py-2 text-left text-sm font-medium text-foreground">
              Name
            </th>
            <th className="px-4 py-2 text-left text-sm font-medium text-foreground">
              Type
            </th>
            <th className="px-4 py-2 text-center text-sm font-medium text-foreground">
              Order
            </th>
            {!isPreviewMode && (
              <th className="px-4 py-2 text-left text-sm font-medium text-foreground">
                Action
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {uniqueBlocks.length > 0 ? (
            uniqueBlocks.map((block, index) => (
              <tr
                key={`${block.id}-${index}`}
                className="border-t border-border"
              >
                <td className="px-4 py-2 text-sm text-foreground">
                  {"name" in block
                    ? (block as BlockData).name
                    : `Block ${index + 1}`}
                </td>
                <td className="px-4 py-2 text-sm text-foreground">
                  <Badge
                    variant="outline"
                    className={`px-2.5 py-1 text-xs font-medium border transition-colors ${getBadgeClassName()}`}
                  >
                    {formatBlockType(
                      "type" in block ? (block as BlockData).type : "CHART"
                    )}
                  </Badge>
                </td>
                <td className="px-4 py-2 text-sm text-foreground text-center">
                  {block.orderIndex}
                </td>
                {!isPreviewMode && (
                  <td className="px-4 py-2 text-sm">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="cursor-pointer"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => onToggleBlock(block.id)}
                          className="cursor-pointer"
                        >
                          {block.isEnabled ?? true ? (
                            <>
                              <EyeOff className="h-4 w-4 mr-2" />
                              {REPORT_UI_TEXT.BUTTONS.DISABLE}
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-2" />
                              {REPORT_UI_TEXT.BUTTONS.ENABLE}
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onEditBlock(block as BlockData)}
                          className="cursor-pointer"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          {REPORT_UI_TEXT.BUTTONS.EDIT}
                        </DropdownMenuItem>
                        {block.type === "CHART" && (
                          <DropdownMenuItem
                            onClick={() =>
                              onExportChartJson(block as unknown as ChartData)
                            }
                            className="cursor-pointer"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            {REPORT_UI_TEXT.BUTTONS.EXPORT_JSON}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => onDuplicateBlock(block as ReportBlock)}
                          className="cursor-pointer"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          {REPORT_UI_TEXT.BUTTONS.DUPLICATE}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDeleteBlock(block.id)}
                          className="text-red-600 focus:text-red-600 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {REPORT_UI_TEXT.BUTTONS.DELETE}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                )}
              </tr>
            ))
          ) : (
            <tr className="border-t border-border">
              <td
                colSpan={isPreviewMode ? 3 : 4}
                className="px-4 py-8 text-center text-muted-foreground"
              >
                {isPreviewMode
                  ? REPORT_UI_TEXT.MESSAGES.NO_BLOCKS_SECTION
                  : REPORT_UI_TEXT.MESSAGES.NO_BLOCKS}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
