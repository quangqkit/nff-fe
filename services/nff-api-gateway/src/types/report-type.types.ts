export interface ReportTypeTemplateConfig {
  sections: string[];
  [key: string]: unknown;
}

export interface ReportTypeResponse {
  id: number;
  name: string;
  description: string | null;
  templateConfig: ReportTypeTemplateConfig | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    reports: number;
  };
}

export interface ReportTypeDetailResponse extends ReportTypeResponse {
  reports: {
    id: number;
    title: string;
    status: string;
    createdAt: Date;
  }[];
  _count: {
    reports: number;
  };
}

export interface CreateReportTypeRequest {
  name: string;
  description?: string;
  templateConfig?: ReportTypeTemplateConfig;
}

export interface UpdateReportTypeRequest {
  name?: string;
  description?: string;
  templateConfig?: ReportTypeTemplateConfig;
  isActive?: boolean;
}

export interface ChartCategoryResponse {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  isActive: boolean;
  createdAt: Date;
}

// Indicator related types
export interface IndicatorResponse {
  id: number;
  name: string;
  symbol: string;
  dataSource: string;
  defaultChartType: string;
  defaultDateRangeStart: Date;
  defaultDateRangeEnd: Date;
  description: string | null;
  category: {
    id: number;
    name: string;
  };
  values?: IndicatorValue[];
}

export interface IndicatorValue {
  indicator_id: string;
  indicator_name: string;
  values: number[];
}

export interface ReportResponse {
  id: number;
  title: string;
  status: string;
  authorId: number;
  content: string | null;
  metadata: string | null;
  author: {
    id: number;
    name: string | null;
    email: string;
  };
  reportType: {
    id: number;
    name: string;
    description: string | null;
  };
  sections: ReportSectionResponse[];
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SimplifiedReportResponse {
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
  exportInfo: {
    hasHtmlExport: boolean;
    hasPdfExport: boolean;
    hasSlidesExport: boolean;
    lastExportDate?: Date;
  };
}

export interface PaginatedReportResponse {
  data: SimplifiedReportResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: {
    applied: {
      search?: string;
      category?: string;
      dateFrom?: string;
      dateTo?: string;
      status?: string;
    };
    available: {
      categories: string[];
      statuses: string[];
    };
  };
}

export interface ReportPreviewResponse {
  id: number;
  title: string;
  status: string;
  content: any;
  sections: ReportSectionResponse[];
  metadata: any;
  author: {
    id: number;
    name: string | null;
    email: string;
  };
  reportType: {
    id: number;
    name: string;
    description: string | null;
  };
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
}

export interface ExportResponse {
  id: number;
  reportId: number;
  exportType: string;
  filePath: string | null;
  status: string;
  createdAt: Date;
  completedAt: Date | null;
  downloadUrl?: string;
}

export interface ShareResponse {
  id: string;
  reportId: number;
  email: string;
  permission: 'view' | 'edit';
  message?: string;
  shareUrl: string;
  expiresAt?: Date;
  createdAt: Date;
}

export interface ReportSectionResponse {
  id: number;
  reportId: number;
  title: string;
  content: string | null;
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
  charts: SectionChartResponse[];
}

export interface SectionChartResponse {
  id: number;
  sectionId: number;
  title: string | null;
  chartConfig: ChartConfig;
  chartData: unknown;
  chartImagePath: string | null;
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
  configurations: ChartConfigurationResponse[];
}

export interface ChartConfigurationResponse {
  id: number;
  sectionChartId: number;
  step1CategoryId: number;
  step2Indicators: unknown;
  step3Config: unknown;
  step4PreviewData: unknown;
  createdAt: Date;
  updatedAt: Date;
  step1Category: {
    id: number;
    name: string;
    icon: string | null;
  };
}

export interface ReportExportResponse {
  id: number;
  reportId: number;
  exportType: string;
  filePath: string | null;
  exportConfig: unknown;
  status: string;
  createdAt: Date;
  completedAt: Date | null;
}

// Chart configuration types
export interface ChartConfig {
  type: 'line' | 'bar' | 'area' | 'pie' | 'scatter';
  title?: string;
  xAxis?: {
    title: string;
    type: 'category' | 'value' | 'time';
  };
  yAxis?: {
    title: string;
    type: 'category' | 'value' | 'time';
  };
  colors?: string[];
  legend?: {
    show: boolean;
    position: 'top' | 'bottom' | 'left' | 'right';
  };
  grid?: {
    show: boolean;
    left?: string;
    right?: string;
    top?: string;
    bottom?: string;
  };
  tooltip?: {
    show: boolean;
    trigger: 'item' | 'axis';
  };
  [key: string]: unknown;
}

export interface ChartStep2Indicators {
  indicatorIds: number[];
  dateRange: {
    start: Date;
    end: Date;
  };
  chartType: string;
}

export interface ChartStep3Config {
  position:
    | 'inline'
    | 'square'
    | 'tight'
    | 'through'
    | 'top-bottom'
    | 'behind'
    | 'front';
  colors: {
    primary: string;
    secondary: string;
    background: string;
  };
  fontSize: {
    title: number;
    axis: number;
    legend: number;
  };
  iconSize: number;
  width: number;
  height: number;
}

export interface ChartStep4PreviewData {
  summary: {
    totalDataPoints: number;
    dateRange: {
      start: Date;
      end: Date;
    };
    indicators: {
      id: number;
      name: string;
      symbol: string;
      dataPoints: number;
    }[];
  };
  chartData: unknown;
  generatedAt: Date;
}
