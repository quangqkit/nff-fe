export interface BlockContent {
  plainText?: string;
  richText?: string;
  chartTitle?: string;
  chartConfig?: Record<string, unknown>;
  chartCustomization?: Record<string, unknown>;
  chartPosition?: string;
  categoryId?: number;
  categoryName?: string;
  selectedIndicators?: Array<Record<string, unknown>>;
  headers?: string[];
  rows?: string[][];
  title?: string;
  bullets?: Array<{
    id: string;
    text: string;
    level: number;
    style?: "bullet" | "number" | "dash" | "arrow";
    checked?: boolean;
  }>;
  noteType?: "info" | "warning" | "error" | "success" | "neutral";
  noteText?: string;
  backgroundColor?: string;
  borderColor?: string;
}

export interface CreateBlockDto {
  name: string;
  type: "TEXT" | "CHART" | "TABLE" | "BULLETS" | "NOTES";
  content: BlockContent;
  columns: number;
  orderIndex: number;
  isEnabled?: boolean;
}

export interface DuplicateBlockDto {
  name: string;
  orderIndex?: number;
}

export interface BlockResponse {
  id: number;
  sectionId: number;
  name: string;
  type: string;
  content: BlockContent;
  columns: number;
  orderIndex: number;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}
