export type Status =
  | "draft"
  | "published"
  | "archived"
  | "processing"
  | "completed"
  | "failed";
export type Theme = "light" | "dark" | "system";
export type SortOrder = "asc" | "desc";
export type UserRole = "admin" | "user" | "viewer";

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User extends BaseEntity {
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
}

export interface SelectOption<T = string> {
  label: string;
  value: T;
  disabled?: boolean;
}

export interface TableColumn<T = any> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: any, record: T) => React.ReactNode;
}

export type ExportFormat = "pdf" | "html" | "excel" | "json";

export interface ExportOptions {
  format: ExportFormat;
  filename?: string;
  includeCharts?: boolean;
  includeData?: boolean;
}
