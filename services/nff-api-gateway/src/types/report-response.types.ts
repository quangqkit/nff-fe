import { BlockType as PrismaBlockType } from '@prisma/client';

// Base response interfaces
export interface AuthorResponse {
  id: number;
  name: string | null;
  email: string;
}

export interface ReportTypeResponse {
  id: number;
  name: string;
  description: string | null;
}

export interface BlockResponse {
  id: number;
  name: string;
  type: PrismaBlockType;
  content: any;
  columns: number;
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SectionResponse {
  id: number;
  title: string;
  isEnabled: boolean;
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
  blocks: BlockResponse[];
}

export interface ReportResponse {
  id: number;
  title: string;
  status: string;
  author: AuthorResponse;
  reportType: ReportTypeResponse;
  summary: string | null;
  tags: string[];
  isArchived: boolean;
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
  sections: SectionResponse[];
}

export interface SimplifiedReportResponse {
  id: number;
  title: string;
  status: string;
  author: AuthorResponse;
  reportType: ReportTypeResponse;
  summary: string | null;
  tags: string[];
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  sectionsCount: number;
  totalBlocks: number;
}

export interface ReportPreviewBlock {
  id: number;
  name: string;
  type: string;
  columns: number;
  orderIndex: number;
  previewContent: {
    type: string;
    content?: string;
    hasRichText?: boolean;
    title?: string;
    chartType?: string;
    hasData?: boolean;
    hasImage?: boolean;
    headers?: string[];
    rowCount?: number;
    bulletCount?: number;
    hasNestedBullets?: boolean;
    noteType?: string;
    hasTitle?: boolean;
    noteText?: string;
  };
}

export interface ReportPreviewSection {
  id: number;
  title: string;
  isEnabled: boolean;
  orderIndex: number;
  blocks: ReportPreviewBlock[];
}

export interface ReportPreviewResponse {
  sections: ReportPreviewSection[];
}

export interface ReportValidationResponse {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface CreateReportRequest {
  title: string;
  reportTypeId: number;
  authorId: number;
  summary?: string;
  tags?: string[];
  metadata?: any;
}

export interface CreateReportWithTemplateRequest {
  reportTypeId: number;
  authorId: number;
  title: string;
}

export interface UpdateReportRequest {
  title?: string;
  summary?: string;
  tags?: string[];
  metadata?: any;
  status?: string;
}

export interface DeleteReportResponse {
  message: string;
}
