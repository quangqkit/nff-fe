import { ChartCategory } from "@/types";

export const CHART_CATEGORIES: ChartCategory[] = [
  {
    id: "options",
    title: "Options",
    description: "Options trading analysis and derivatives data",
    icon: "📈",
  },
  {
    id: "cta",
    title: "CTA",
    description: "Commodity Trading Advisor strategies",
    icon: "📢",
  },
  {
    id: "micro",
    title: "Micro",
    description: "Individual stock and company analysis",
    icon: "🏢",
  },
  {
    id: "macro",
    title: "Macro",
    description: "Economic indicators and market trends",
    icon: "🌍",
  },
  {
    id: "combination",
    title: "Combination category",
    description: "Mixed analysis and combined strategies",
    icon: "🔗",
  },
  {
    id: "exclusive",
    title: "Exclusive Category",
    description: "Premium and exclusive analysis tools",
    icon: "⭐",
  },
];

export const CHART_DIALOG_STEPS = [
  { id: "select-category", title: "Select category" },
  { id: "select-indicators", title: "Indicators" },
  { id: "chart-config", title: "Chart config" },
  { id: "preview", title: "Preview" },
];

export const CHART_DIALOG_STEPS_COMBINATION = [
  { id: "select-category", title: "Select category" },
  { id: "select-indicators", title: "Indicators" },
  { id: "date-chart-type", title: "Date & chart type" },
  { id: "chart-config", title: "Chart config" },
  { id: "preview", title: "Preview" },
];