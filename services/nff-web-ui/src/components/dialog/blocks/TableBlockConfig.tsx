import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

interface TableBlockConfigProps {
  blockName: string;
  setBlockName: (name: string) => void;
  order: number;
  setOrder: (order: number) => void;
  columns: number;
  setColumns: (columns: number) => void;
}

export function TableBlockConfig({
  blockName,
  setBlockName,
  order,
  setOrder,
  columns,
  setColumns,
}: TableBlockConfigProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="table-blockName">Block name</Label>
            <Input
              id="table-blockName"
              value={blockName}
              onChange={(e) => setBlockName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="table-order">Order</Label>
            <NumberInput
              id="table-order"
              value={order}
              onChange={setOrder}
              min={0}
              max={999}
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="table-columns">Columns</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-gray-500 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>12 columns in grid system</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <NumberInput
              id="table-columns"
              value={columns}
              onChange={setColumns}
              min={1}
              max={12}
              placeholder="12"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
