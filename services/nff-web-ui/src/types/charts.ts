export type ChartType = "line" | "bar" | "pie" | "area" | "scatter";
export type ChartCategoryId =
  | "options"
  | "cta"
  | "micro"
  | "macro"
  | "combination"
  | "exclusive";
export type DateRangePreset = "1Y" | "2Y" | "5Y" | "10Y" | "MAX" | "CUSTOM";
export type ChartPosition =
  | "inline"
  | "square"
  | "tight"
  | "through"
  | "top-bottom"
  | "behind-text"
  | "front-text";

export interface ChartCategory {
  id: ChartCategoryId;
  title: string;
  description: string;
  icon: string;
  isSelected?: boolean;
}

export interface ChartDataPoint {
  x: string | number | Date;
  y: number;
  label?: string;
  metadata?: Record<string, unknown>;
}

export interface ChartDataset {
  label: string;
  data: ChartDataPoint[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  fill?: boolean;
  tension?: number;
  pointRadius?: number;
  pointHoverRadius?: number;
  pointBackgroundColor?: string;
  pointBorderColor?: string;
  pointBorderWidth?: number;
  pointHoverBackgroundColor?: string;
  pointHoverBorderColor?: string;
  pointHoverBorderWidth?: number;
  type?: "line" | "bar" | "scatter" | "bubble";
  yAxisID?: string;
  xAxisID?: string;
  order?: number;
  hidden?: boolean;
}

export interface ChartData {
  id: number;
  title: string | null;
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartConfig {
  type?: string;
  position?: string;
  title?: string;
  xAxis?: {
    title?: string;
    type?: string;
  };
  yAxis?: {
    title?: string;
    type?: string;
  };
  series?: Array<{
    name: string;
    data: number[];
    type?: string;
  }>;
  options?: Record<string, unknown>;
}

export interface ChartOptions {
  responsive: boolean;
  maintainAspectRatio: boolean;
  aspectRatio?: number;
  plugins: {
    title?: {
      display: boolean;
      text: string;
      font?: {
        size: number;
        family: string;
        weight: "normal" | "bold" | "lighter" | "bolder" | number;
      };
      color?: string;
    };
    legend?: {
      display: boolean;
      position: "top" | "bottom" | "left" | "right";
      labels?: {
        usePointStyle: boolean;
        pointStyle:
          | "circle"
          | "cross"
          | "crossRot"
          | "dash"
          | "line"
          | "rect"
          | "rectRounded"
          | "star"
          | "triangle";
        color: string;
        font: {
          size: number;
          family: string;
          weight: "normal" | "bold" | "lighter" | "bolder" | number;
        };
      };
    };
    tooltip?: {
      enabled: boolean;
      mode: "index" | "point" | "nearest" | "dataset" | "x" | "y";
      intersect: boolean;
      backgroundColor?: string;
      titleColor?: string;
      bodyColor?: string;
      borderColor?: string;
      borderWidth?: number;
    };
  };
  scales?: {
    x?: {
      display: boolean;
      title?: {
        display: boolean;
        text: string;
        color?: string;
        font?: {
          size: number;
          family: string;
          weight: "normal" | "bold" | "lighter" | "bolder" | number;
        };
      };
      grid?: {
        display: boolean;
        color?: string;
        drawBorder?: boolean;
        drawOnChartArea?: boolean;
        drawTicks?: boolean;
      };
      ticks?: {
        color?: string;
        font?: {
          size: number;
          family: string;
          weight: "normal" | "bold" | "lighter" | "bolder" | number;
        };
      };
    };
    y?: {
      display: boolean;
      title?: {
        display: boolean;
        text: string;
        color?: string;
        font?: {
          size: number;
          family: string;
          weight: "normal" | "bold" | "lighter" | "bolder" | number;
        };
      };
      grid?: {
        display: boolean;
        color?: string;
        drawBorder?: boolean;
        drawOnChartArea?: boolean;
        drawTicks?: boolean;
      };
      ticks?: {
        color?: string;
        font?: {
          size: number;
          family: string;
          weight: "normal" | "bold" | "lighter" | "bolder" | number;
        };
      };
    };
  };
  interaction?: {
    intersect: boolean;
    mode: "index" | "point" | "nearest" | "dataset" | "x" | "y";
  };
  animation?: {
    duration: number;
    easing: "linear" | "easeInQuad" | "easeOutQuad" | "easeInOutQuad";
  };
}

export interface Indicator {
  id: string;
  name: string;
  description: string;
  category: ChartCategoryId;
  defaultChartType: ChartType;
  defaultDateRange: DateRangePreset;
  latest_date: string;
  isAvailable: boolean;
  metadata?: {
    source?: string;
    frequency?: string;
    unit?: string;
  };
}

export interface SelectedIndicator {
  indicatorId: string;
  chartType: ChartType;
  dateRange: {
    preset: DateRangePreset;
    customStart?: Date;
    customEnd?: Date;
  };
  isSelected: boolean;
  config?: IndicatorConfig;
  value?: number;
  subcategoryData?: {
    name: string;
    id: number;
    indicators: string[];
    values: number[];
  };
}

export interface IndicatorConfig {
  color?: string;
  opacity?: number;
  lineWidth?: number;
  showDataLabels?: boolean;
  showLegend?: boolean;
  customSettings?: Record<string, unknown>;
}

export interface ChartCustomization {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    grid: string;
  };
  typography: {
    fontFamily: string;
    fontSize: number;
    fontWeight: "normal" | "medium" | "semibold" | "bold";
    titleSize: number;
    labelSize: number;
  };
  icons: {
    showLegend: boolean;
    showDataLabels: boolean;
    showGrid: boolean;
    showAxes: boolean;
    iconStyle: "outline" | "filled" | "minimal";
  };
  size: {
    width: number;
    height: number;
    aspectRatio: "auto" | "square" | "wide" | "tall";
    responsive: boolean;
  };
  theme: {
    mode: "light" | "dark" | "auto";
    palette: "default" | "colorful" | "monochrome" | "pastel";
  };
}

export interface ChartDataStructure {
  id: number;
  title: string | null;
  chartConfig: ChartConfig;
  chartData: {
    labels?: string[];
    datasets?: Array<{
      label: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string | string[];
      borderWidth?: number;
    }>;
    [key: string]: unknown;
  };
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

export interface ChartDataTransfer {
  id: number;
  title: string;
  categoryId: number;
  categoryName: string;
  selectedIndicators: SelectedIndicator[];
  chartConfig: Record<string, unknown>;
  chartCustomization: ChartCustomization;
  chartPosition: ChartPosition;
  orderIndex: number;
  generatedAt: Date;
  status: "generated";
}

export interface ChartPreviewData {
  hasData: boolean;
  indicatorCount: number;
  categoryName: string;
  chartType: string;
  position: string;
  title: string;
  chartData: ChartData;
  chartOptions: ChartOptions;
}

export interface ChartSummaryData {
  hasData: boolean;
  indicatorCount: number;
  categoryName: string;
  chartType: string;
  position: string;
  title: string;
  chartData: ChartData;
  chartOptions: ChartOptions;
}

export interface ChartDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: (data: ChartDialogData) => void;
  title: string;
  steps: Array<{
    id: string;
    title: string;
    isActive?: boolean;
    isCompleted?: boolean;
  }>;
  currentStep: number;
  onStepChange?: (step: number) => void;
  reportId?: number;
  sectionId?: number;
  reportTypeId?: number;
  editingChart?: ChartDataStructure;
  isEditMode?: boolean;
  initialTitle?: string;
  onChartGenerated?: (chart: {
    id: number;
    title: string | null;
    chartConfig: {
      type?: string;
      position?: string;
      title?: string;
      xAxis?: {
        title?: string;
        type?: string;
      };
      yAxis?: {
        title?: string;
        type?: string;
      };
      series?: Array<{
        name: string;
        data: number[];
        type?: string;
      }>;
      options?: Record<string, unknown>;
    };
    chartData: {
      labels?: string[];
      datasets?: Array<{
        label: string;
        data: number[];
        backgroundColor?: string | string[];
        borderColor?: string | string[];
        borderWidth?: number;
      }>;
      [key: string]: unknown;
    };
    chartImagePath: string | null;
    orderIndex: number;
    generatedAt: Date;
    status: "generated" | "failed";
  }) => void;
}

export interface ChartDialogData {
  selectedCategory?: ChartCategory;
  selectedIndicators: SelectedIndicator[];
  chartConfig?: {
    position: ChartPosition;
    customization: ChartCustomization;
    title?: string;
    subtitle?: string;
    layout?: "vertical" | "horizontal";
  };
  preview?: ChartPreviewData;
}
