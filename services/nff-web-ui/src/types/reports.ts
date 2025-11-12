import { BaseEntity, Status, User } from "./core";
import { ChartDataStructure } from "./charts";

export type ReportType = "financial" | "operational" | "marketing" | "custom";
export type BlockType =
  | "text"
  | "chart"
  | "table"
  | "image"
  | "notes"
  | "bullets";

export interface Report extends BaseEntity {
  title: string;
  description?: string;
  status: Status;
  reportType: ReportType;
  author: User;
  summary?: string;
  tags: string[];
  htmlFileUrl?: string;
  googleSlidesUrl?: string;
  publishedAt?: Date;
  lastUpdated: Date;
  exportInfo: ExportInfo;
  sections: ReportSection[];
}

export interface ExportInfo {
  hasHtmlExport: boolean;
  hasPdfExport: boolean;
  hasSlidesExport: boolean;
}

export interface ReportSection {
  id: number;
  reportId: number;
  title: string;
  isEnabled: boolean;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
  blocks: ReportBlock[];
}

export interface ReportBlock {
  id: number;
  sectionId: number;
  name: string;
  type: string;
  content: Record<string, unknown>;
  columns?: number;
  orderIndex: number;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BlockContent {
  plainText?: string;
  chartTitle?: string;
  headers?: string[];
  rows?: string[][];
  bullets?: string[];
  noteType?: string;
  noteText?: string;
}

export interface BlockData {
  id: number;
  sectionId: number;
  name: string;
  type: string;
  content: BlockContent;
  columns: number;
  orderIndex: number;
  isEnabled?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SectionData {
  id: number;
  reportId: number;
  title: string;
  content: string | null;
  orderIndex: number;
  isEnabled?: boolean;
  createdAt: string;
  updatedAt: string;
  charts?: ChartDataStructure[];
  blocks?: BlockData[];
}

export interface ChartData {
  id: number;
  title: string | null;
  chartConfig: any;
  chartData: any;
  chartImagePath: string | null;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
  chartSelection: {
    id: number;
    categoryName: string;
    selectedIndicators: any[];
  } | null;
  chartConfiguration: {
    id: number;
    config: string;
  } | null;
  [key: string]: unknown;
}

export interface CreateReportRequest {
  title: string;
  description?: string;
  reportType: ReportType;
  sections: Omit<ReportSection, "id" | "createdAt" | "updatedAt">[];
}

export interface UpdateReportRequest {
  title?: string;
  description?: string;
  status?: Status;
  sections?: Omit<ReportSection, "id" | "createdAt" | "updatedAt">[];
}

export interface ReportFilters {
  search?: string;
  status?: Status;
  reportType?: ReportType;
  dateFrom?: string;
  dateTo?: string;
  authorId?: string;
}

export interface GeneratedReport {
  id: string;
  type: string;
  reportTypeId?: number;
  sections: ReportSection[];
}

export interface ReportListItem {
  id: number;
  title: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
  lastUpdated: Date;
  reportType: {
    id: number;
    name: string;
    description: string | null;
  };
  author: {
    id: number;
    name: string | null;
    email: string;
  };
  htmlFileUrl?: string | null;
  googleSlidesUrl?: string | null;
  summary?: string | null;
  tags?: string[];
  exportInfo: ExportInfo;
}

export interface ReportListFilters {
  search?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  [key: string]: unknown;
}

export interface AppliedFilters {
  search?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
}

export interface AvailableFilters {
  categories: string[];
  statuses: string[];
}

export interface FiltersInfo {
  applied: AppliedFilters;
  available: AvailableFilters;
}

export interface PaginatedReportResponse {
  data: ReportListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: FiltersInfo;
}

export interface AddSectionRequest {
  reportId: number;
}

export interface UpdateSectionRequest {
  title: string;
}

export interface AddSectionResponse {
  id: number;
  reportId: number;
  title: string;
  content: string | null;
  orderIndex: number;
  charts: ChartData[];
}

export interface UpdateChartRequest {
  categoryId: number;
  selectedIndicators: Array<{
    id: number;
    chartType: string;
    dateRange: {
      preset: string;
      customStart?: string;
      customEnd?: string;
    };
  }>;
  chartConfig: {
    position: string;
    config: string;
  };
}

export interface UpdateChartResponse {
  id: number;
  title: string | null;
  chartConfig: any;
  chartData: any;
  chartImagePath: string | null;
  orderIndex: number;
  updatedAt: string;
}

export interface DeleteChartResponse {
  message: string;
  deletedChartId: number;
}

export interface ReportFormData {
  reportTypes: Array<{ id: number; name: string; description?: string }>;
  selectedReportType: string;
  selectedReportTypeId?: number;
  isLoadingReportTypes: boolean;
  reportTypesError: string | null;
  isGenerating: boolean;
}

export interface ReportEditorState {
  generatedReport: GeneratedReport | null;
  sectionsData: Record<number, SectionData>;
  sectionStates: Record<number, boolean>;
  currentSectionId: number | null;
  livePreviewKey: number;
}

export interface ReportTitleState {
  reportTitle: string;
  reportSummary: string;
  isEditingTitle: boolean;
  originalTitle: string;
  originalSummary: string;
  isSavingTitle: boolean;
  isSavingSummary: boolean;
}

export interface SectionEditState {
  editingSection: number | null;
  sectionOriginalTitles: Record<number, string>;
  beforeEditSectionTitles: Record<number, string>;
}

export interface BlockEditState {
  editingBlock: ReportBlock | null;
  blockToDelete: number | null;
  isEditMode: boolean;
}

export interface DialogState {
  showChartDialog: boolean;
  chartDialogStep: number;
  showBlockDialog: boolean;
  blockDialogStep: number;
  editingChart: ChartDataStructure | null;
  isAddingNewSection: boolean;
}

export interface ReportActions {
  handleGenerateReport: () => Promise<void>;
  handleToggleSection: (sectionId: number) => Promise<void>;
  handleToggleBlock: (blockId: number) => Promise<void>;
  handleDeleteBlock: (blockId: number) => Promise<void>;
  handleDuplicateBlock: (block: ReportBlock) => void;
  handleEditBlock: (block: BlockData) => void;
  handleExportChartJson: (chart: ChartData) => Promise<void>;
  handleAddSection: () => Promise<void>;
  handleSaveReportTitle: () => Promise<void>;
  handleSaveReportSummary: () => Promise<void>;
  handleCancelTitleEdit: () => void;
  handleSaveSectionTitle: (
    sectionId: number,
    newTitle: string
  ) => Promise<void>;
  handleCancelSectionEdit: (sectionId: number) => void;
  handleClearTitle: () => void;
  handleClearSectionTitle: (sectionId: number) => void;
}

export interface ReportComponentProps {
  reportFormData: ReportFormData;
  reportEditorState: ReportEditorState;
  reportTitleState: ReportTitleState;
  sectionEditState: SectionEditState;
  blockEditState: BlockEditState;
  dialogState: DialogState;
  actions: ReportActions;
  isPreviewMode?: boolean;
}
