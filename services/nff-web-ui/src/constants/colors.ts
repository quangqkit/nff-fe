export const COLORS = {
  PRIMARY: {
    50: '#f0f2ff',
    100: '#e0e7ff', 
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#707FDD',
    600: '#6366f1',
    700: '#4f46e5',
    800: '#4338ca',
    900: '#3730a3',
  },
} as const;

export const MAIN_COLOR = COLORS.PRIMARY[500];
export const MAIN_COLOR_HOVER = COLORS.PRIMARY[600];
``