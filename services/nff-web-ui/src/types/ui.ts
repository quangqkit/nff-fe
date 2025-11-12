import { User } from "./core";

export interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  current?: boolean;
  badge?: number;
}

export interface BreadcrumbItem {
  name: string;
  href: string;
  current?: boolean;
}

export interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
  className?: string;
}

export interface NavigationBarProps {
  className?: string;
}

export interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  className?: string;
}

export interface AvatarProps {
  user?: User;
  className?: string;
}

export interface ThemeToggleProps {
  className?: string;
}

export interface ChartDialogStep {
  id: string;
  title: string;
  isActive?: boolean;
  isCompleted?: boolean;
}

export interface ChartTypeOption {
  value: string;
  label: string;
  description: string;
  icon: string;
  isAvailable: boolean;
}

export interface DateRangeOption {
  value: string;
  label: string;
  description: string;
  startDate: Date;
  endDate: Date;
}

export interface ChartPositionOption {
  value: string;
  label: string;
  description: string;
  icon: string;
  isDefault?: boolean;
}
