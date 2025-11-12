import { Text, BarChart3, Table, List, StickyNote } from "lucide-react";

export const BLOCK_DIALOG_STEPS = [
  {
    id: "type",
    title: "Type",
    description: "Select the type of block to create",
    icon: <Text className="h-4 w-4" />,
  },
  {
    id: "content",
    title: "Content",
    description: "Configure the block content",
    icon: <BarChart3 className="h-4 w-4" />,
  },
  {
    id: "layout",
    title: "Layout",
    description: "Set the block layout and positioning",
    icon: <Table className="h-4 w-4" />,
  },
  {
    id: "styling",
    title: "Styling",
    description: "Customize the block appearance",
    icon: <List className="h-4 w-4" />,
  },
  {
    id: "preview",
    title: "Preview",
    description: "Preview the final block",
    icon: <StickyNote className="h-4 w-4" />,
  },
];
