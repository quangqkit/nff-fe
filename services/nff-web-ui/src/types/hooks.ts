export interface UsePaginationProps {
  initialPage?: number;
  pageSize?: number;
}

export interface UsePaginationReturn {
  currentPage: number;
  pageSize: number;
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  goToFirstPage: () => void;
  goToLastPage: (totalPages: number) => void;
  reset: () => void;
}

export interface UseSelectionProps<T> {
  getKey: (item: T) => string | number;
  initialSelected?: (string | number)[];
}

export interface UseSelectionReturn<T> {
  selectedItems: (string | number)[];
  isSelected: (item: T) => boolean;
  isAllSelected: (items: T[]) => boolean;
  isIndeterminate: (items: T[]) => boolean;
  selectItem: (item: T) => void;
  deselectItem: (item: T) => void;
  toggleItem: (item: T) => void;
  selectAll: (items: T[]) => void;
  deselectAll: () => void;
  toggleAll: (items: T[]) => void;
  setSelectedItems: (items: (string | number)[]) => void;
  reset: () => void;
  selectedCount: number;
}

export interface UseAsyncStateReturn<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  execute: (...args: any[]) => Promise<T>;
  reset: () => void;
}

export interface UseFilterStateReturn<T> {
  filters: T;
  updateFilters: (newFilters: Partial<T>) => void;
  resetFilters: () => void;
  hasActiveFilters: boolean;
}

export interface UseExportStateReturn {
  isExporting: boolean;
  exportProgress: number;
  exportStatus: string;
  exportMessage: string;
  startExport: () => void;
  updateProgress: (progress: number) => void;
  completeExport: (status: string, message: string) => void;
  failExport: (error: string) => void;
}

export interface UseFormStateReturn<T> {
  formData: T;
  errors: Record<keyof T, string>;
  isValid: boolean;
  isDirty: boolean;
  setField: <K extends keyof T>(field: K, value: T[K]) => void;
  setError: <K extends keyof T>(field: K, error: string) => void;
  clearError: <K extends keyof T>(field: K) => void;
  reset: () => void;
  submit: () => Promise<boolean>;
}
