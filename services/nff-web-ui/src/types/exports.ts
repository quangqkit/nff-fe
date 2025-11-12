export interface ExportRequest {
  config?: {
    includeCharts?: boolean;
    includeImages?: boolean;
    chartId?: number;
  };
}

export interface ExportResponse {
  success: boolean;
  data: {
    id: number;
    reportId: number;
    exportType: "pdf" | "html";
    status: "pending" | "processing" | "completed" | "failed";
    downloadUrl?: string;
    fileName?: string;
    filePath?: string;
    fileSize?: number;
    error?: string;
  };
  message: string;
}

export interface ExportStatusResponse {
  success: boolean;
  data: {
    id: number;
    reportId: number;
    exportType: "pdf" | "html";
    status: "pending" | "processing" | "completed" | "failed";
    downloadUrl?: string;
    fileName?: string;
    filePath?: string;
    fileSize?: number;
    error?: string;
  };
  message?: string;
}

export interface ExportConfig {
  format?: string;
  includeCharts?: boolean;
  includeData?: boolean;
  customSettings?: Record<string, unknown>;
}

export interface ExportInfo {
  id: number;
  type: string;
  createdAt: Date;
  downloadUrl: string;
  fileSize: number;
}
