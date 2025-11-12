export const AUTH_CONSTANTS = {
  ACCESS_TOKEN_KEY: "nff_access_token",
  REFRESH_TOKEN_KEY: "nff_refresh_token",
  TOKEN_EXPIRY_BUFFER: 5 * 60 * 1000,
} as const;

export const AUTH_ROUTES = {
  LOGIN: "/login",
  DASHBOARD: "/dashboard",
  LOGOUT: "/logout",
} as const;
