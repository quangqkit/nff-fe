import { NavigationItem } from "@/types";
import {
  Bell,
  Database,
  FileText,
  HelpCircle,
  LayoutDashboard,
  ListTodo,
  Monitor,
  Settings,
  User,
} from "lucide-react";

export const MAIN_NAVIGATION: NavigationItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Reports",
    href: "/reports",
    icon: FileText,
    badge: 3,
  },
  {
    name: "Ingestion",
    href: "/ingestion",
    icon: Database,
    badge: 3,
  },
  {
    name: "Monitoring",
    href: "/monitoring",
    icon: Monitor,
  },
  {
    name: "Jobs/Queue",
    href: "/jobs",
    icon: ListTodo,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export const USER_MENU_ITEMS = [
  {
    name: "Profile",
    href: "/profile",
    icon: User,
  },
  {
    name: "Notifications",
    href: "/notifications",
    icon: Bell,
    badge: 3,
  },
  {
    name: "Help & Support",
    href: "/help",
    icon: HelpCircle,
  },
];

export const BREADCRUMB_MAP: Record<string, string> = {
  dashboard: "Dashboard",
  reports: "Reports",
  monitoring: "Monitoring",
  settings: "Settings",
  profile: "Profile",
};
