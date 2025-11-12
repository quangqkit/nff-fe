import { ChartPositionOption, ChartCustomization, ChartPosition } from "@/types";

export const CHART_POSITION_OPTIONS: ChartPositionOption[] = [
  {
    value: 'inline',
    label: 'In line with text',
    description: 'Chart flows with text content',
    icon: '📄',
    isDefault: false,
  },
  {
    value: 'square',
    label: 'Square',
    description: 'Text wraps around chart in square shape',
    icon: '⬜',
    isDefault: true,
  },
  {
    value: 'tight',
    label: 'Tight',
    description: 'Text wraps closely around chart contours',
    icon: '🔲',
    isDefault: false,
  },
  {
    value: 'through',
    label: 'Through',
    description: 'Text flows through chart area',
    icon: '🔳',
    isDefault: false,
  },
  {
    value: 'top-bottom',
    label: 'Top and bottom',
    description: 'Text above and below chart only',
    icon: '📊',
    isDefault: false,
  },
  {
    value: 'behind-text',
    label: 'Behind text',
    description: 'Chart positioned behind text',
    icon: '🔙',
    isDefault: false,
  },
  {
    value: 'front-text',
    label: 'In front of text',
    description: 'Chart positioned in front of text',
    icon: '🔜',
    isDefault: false,
  },
];

export const DEFAULT_CHART_CUSTOMIZATION: ChartCustomization = {
  colors: {
    primary: '#3b82f6',
    secondary: '#10b981',
    background: '#ffffff',
    text: '#1f2937',
    grid: '#e5e7eb',
  },
  typography: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: 'medium',
    titleSize: 18,
    labelSize: 12,
  },
  icons: {
    showLegend: true,
    showDataLabels: false,
    showGrid: true,
    showAxes: true,
    iconStyle: 'outline',
  },
  size: {
    width: 800,
    height: 400,
    aspectRatio: 'wide',
    responsive: true,
  },
  theme: {
    mode: 'light',
    palette: 'default',
  },
};

export const FONT_FAMILY_OPTIONS = [
  { value: 'Inter', label: 'Inter', description: 'Modern, clean font' },
  { value: 'Roboto', label: 'Roboto', description: 'Google font, versatile' },
  { value: 'Arial', label: 'Arial', description: 'Classic, widely supported' },
  { value: 'Helvetica', label: 'Helvetica', description: 'Professional, clean' },
  { value: 'Times New Roman', label: 'Times New Roman', description: 'Traditional, serif' },
  { value: 'Georgia', label: 'Georgia', description: 'Readable serif font' },
];

export const FONT_WEIGHT_OPTIONS = [
  { value: 'normal', label: 'Normal', description: 'Regular weight' },
  { value: 'medium', label: 'Medium', description: 'Slightly bold' },
  { value: 'semibold', label: 'Semibold', description: 'Bold weight' },
  { value: 'bold', label: 'Bold', description: 'Heavy weight' },
];

export const ASPECT_RATIO_OPTIONS = [
  { value: 'auto', label: 'Auto', description: 'Automatic sizing' },
  { value: 'square', label: 'Square', description: '1:1 ratio' },
  { value: 'wide', label: 'Wide', description: '16:9 ratio' },
  { value: 'tall', label: 'Tall', description: '9:16 ratio' },
];

export const ICON_STYLE_OPTIONS = [
  { value: 'outline', label: 'Outline', description: 'Outlined icons' },
  { value: 'filled', label: 'Filled', description: 'Solid icons' },
  { value: 'minimal', label: 'Minimal', description: 'Simple icons' },
];

export const THEME_MODE_OPTIONS = [
  { value: 'light', label: 'Light', description: 'Light theme' },
  { value: 'dark', label: 'Dark', description: 'Dark theme' },
  { value: 'auto', label: 'Auto', description: 'Follow system' },
];

export const COLOR_PALETTE_OPTIONS = [
  { value: 'default', label: 'Default', description: 'Standard colors' },
  { value: 'colorful', label: 'Colorful', description: 'Vibrant colors' },
  { value: 'monochrome', label: 'Monochrome', description: 'Single color scheme' },
  { value: 'pastel', label: 'Pastel', description: 'Soft, muted colors' },
];

export const COLOR_SCHEMES = {
  default: {
    primary: '#3b82f6',
    secondary: '#10b981',
    background: '#ffffff',
    text: '#1f2937',
    grid: '#e5e7eb',
  },
  colorful: {
    primary: '#ff6b6b',
    secondary: '#4ecdc4',
    background: '#ffffff',
    text: '#2c3e50',
    grid: '#bdc3c7',
  },
  monochrome: {
    primary: '#2c3e50',
    secondary: '#34495e',
    background: '#ffffff',
    text: '#2c3e50',
    grid: '#bdc3c7',
  },
  pastel: {
    primary: '#a8e6cf',
    secondary: '#ffd3a5',
    background: '#ffffff',
    text: '#2c3e50',
    grid: '#e8f4f8',
  },
};

export const getChartPositionOption = (position: ChartPosition): ChartPositionOption | undefined => {
  return CHART_POSITION_OPTIONS.find(option => option.value === position);
};

export const getDefaultChartPosition = (): ChartPosition => {
  return CHART_POSITION_OPTIONS.find(option => option.isDefault)?.value as ChartPosition || 'square';
};

export const getColorScheme = (palette: string) => {
  return COLOR_SCHEMES[palette as keyof typeof COLOR_SCHEMES] || COLOR_SCHEMES.default;
};
