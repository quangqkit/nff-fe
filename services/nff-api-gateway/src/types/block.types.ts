export enum BlockType {
  TEXT = 'TEXT',
  CHART = 'CHART',
  TABLE = 'TABLE',
  BULLETS = 'BULLETS',
  NOTES = 'NOTES',
}

// Base block interface
export interface BaseBlockContent {
  [key: string]: any;
}

// Text block content
export interface TextBlockContent extends BaseBlockContent {
  richText: string; // JSON stringified rich text editor content
  plainText?: string; // Optional plain text fallback
}

// Chart block content
export interface ChartBlockContent extends BaseBlockContent {
  chartTitle: string;
  chartConfig: {
    type?: string;
    position?: string;
    title?: string;
    xAxis?: {
      title?: string;
      type?: string;
    };
    yAxis?: {
      title?: string;
      type?: string;
    };
    series?: Array<{
      name: string;
      data: number[];
      type?: string;
    }>;
    options?: Record<string, unknown>;
  };
  chartData?: {
    labels?: string[];
    datasets?: Array<{
      label: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string | string[];
      borderWidth?: number;
    }>;
    [key: string]: unknown;
  };
  chartImagePath?: string;
  indicatorConfigs?: Array<{
    indicatorId: number;
    chartType: string;
    dateRangeStart: Date;
    dateRangeEnd: Date;
  }>;
}

// Table block content
export interface TableBlockContent extends BaseBlockContent {
  tableTitle?: string;
  headers: string[];
  rows: Array<Array<string | number>>;
  styling?: {
    headerStyle?: Record<string, string>;
    rowStyle?: Record<string, string>;
    alternateRowColors?: boolean;
  };
}

// Bullets block content
export interface BulletsBlockContent extends BaseBlockContent {
  title?: string;
  bullets: Array<{
    id: string;
    text: string;
    level: number; // 0-based nesting level
    style?: 'bullet' | 'number' | 'dash' | 'arrow';
  }>;
}

// Notes block content
export interface NotesBlockContent extends BaseBlockContent {
  title?: string;
  noteText: string; // Can be rich text or plain text
  noteType?: 'info' | 'warning' | 'error' | 'success' | 'neutral';
  backgroundColor?: string;
  borderColor?: string;
}

// Union type for all block contents
export type BlockContent =
  | TextBlockContent
  | ChartBlockContent
  | TableBlockContent
  | BulletsBlockContent
  | NotesBlockContent;

// Base block interface
export interface ReportBlock {
  id: number;
  sectionId: number;
  name: string;
  type: BlockType;
  content: BlockContent;
  columns: number; // 1-12 grid columns
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
}

// Report section interface
export interface ReportSection {
  id: number;
  reportId: number;
  title: string;
  isEnabled: boolean;
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
  blocks: ReportBlock[];
}

// Updated report interface
export interface Report {
  id: number;
  title: string;
  reportTypeId: number;
  status: string;
  authorId: number;
  metadata?: Record<string, any>;
  summary?: string;
  tags: string[];
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  sections: ReportSection[];
}
