import {
  ChartTypeOption,
  DateRangeOption,
} from "@/types";

export const CHART_TYPE_OPTIONS: ChartTypeOption[] = [
  {
    value: "line",
    label: "Line Chart",
    description: "Shows trends over time",
    icon: "📈",
    isAvailable: true,
  },
  {
    value: "bar",
    label: "Bar Chart",
    description: "Compares values across categories",
    icon: "📊",
    isAvailable: true,
  },
];

export const DATE_RANGE_OPTIONS: DateRangeOption[] = [
  {
    value: "1Y",
    label: "1 Year",
    description: "Last 12 months",
    startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
  },
  {
    value: "2Y",
    label: "2 Years",
    description: "Last 24 months",
    startDate: new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
  },
  {
    value: "5Y",
    label: "5 Years",
    description: "Last 5 years",
    startDate: new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
  },
  {
    value: "10Y",
    label: "10 Years",
    description: "Last 10 years",
    startDate: new Date(Date.now() - 10 * 365 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
  },
  {
    value: "MAX",
    label: "Maximum",
    description: "All available data",
    startDate: new Date("2000-01-01"),
    endDate: new Date(),
  },
  {
    value: "CUSTOM",
    label: "Custom Range",
    description: "Select custom dates",
    startDate: new Date("2000-01-01"),
    endDate: new Date(),
  },
];

export const getChartTypeOption = (
  type: string
): ChartTypeOption | undefined => {
  return CHART_TYPE_OPTIONS.find((option) => option.value === type);
};

export const getDateRangeOption = (
  preset: string
): DateRangeOption | undefined => {
  return DATE_RANGE_OPTIONS.find((option) => option.value === preset);
};
