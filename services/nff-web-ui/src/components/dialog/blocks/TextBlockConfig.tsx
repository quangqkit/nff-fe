import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { TiptapEditor } from "@/components/ui/tiptap-editor";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

interface TextBlockConfigProps {
  blockName: string;
  setBlockName: (name: string) => void;
  order: number;
  setOrder: (order: number) => void;
  columns: number;
  setColumns: (columns: number) => void;
  paragraphContent: string;
  setParagraphContent: (content: string) => void;
}

export function TextBlockConfig({
  blockName,
  setBlockName,
  order,
  setOrder,
  columns,
  setColumns,
  paragraphContent,
  setParagraphContent,
}: TextBlockConfigProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="text-blockName">Block name</Label>
            <Input
              id="text-blockName"
              value={blockName}
              onChange={(e) => setBlockName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="text-order">Order</Label>
            <NumberInput
              id="text-order"
              value={order}
              onChange={setOrder}
              min={0}
              max={999}
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="text-columns">Columns</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>12 columns in grid system</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <NumberInput
              id="text-columns"
              value={columns}
              onChange={setColumns}
              min={1}
              max={12}
              placeholder="12"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="text-paragraph">Enter your paragraph/ note</Label>
        <TiptapEditor
          content={paragraphContent}
          onChange={setParagraphContent}
          placeholder="Enter your paragraph content here..."
          className="min-h-[200px]"
          disableLists={true}
        />
      </div>
    </div>
  );
}
