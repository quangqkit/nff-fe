import { AUTH_CONSTANTS } from "./constants";

export interface TokenData {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

export class TokenManager {
  private static instance: TokenManager;

  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  private constructor() {}

  setTokens(tokenData: TokenData): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(
        AUTH_CONSTANTS.ACCESS_TOKEN_KEY,
        tokenData.accessToken
      );

      if (tokenData.refreshToken) {
        localStorage.setItem(
          AUTH_CONSTANTS.REFRESH_TOKEN_KEY,
          tokenData.refreshToken
        );
      }

      if (tokenData.expiresAt) {
        localStorage.setItem(
          "token_expires_at",
          tokenData.expiresAt.toString()
        );
      }
    } catch (error) {
      console.error("Error setting auth tokens:", error);
    }
  }

  getAccessToken(): string | null {
    if (typeof window === "undefined") return null;

    try {
      return localStorage.getItem(AUTH_CONSTANTS.ACCESS_TOKEN_KEY);
    } catch (error) {
      console.error("Error getting access token:", error);
      return null;
    }
  }

  getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;

    try {
      return localStorage.getItem(AUTH_CONSTANTS.REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error("Error getting refresh token:", error);
      return null;
    }
  }

  clearTokens(): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.removeItem(AUTH_CONSTANTS.ACCESS_TOKEN_KEY);
      localStorage.removeItem(AUTH_CONSTANTS.REFRESH_TOKEN_KEY);
      localStorage.removeItem("token_expires_at");
    } catch (error) {
      console.error("Error clearing auth tokens:", error);
    }
  }

  isTokenValid(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;

    try {
      const payload = this.parseJwtPayload(token);
      const currentTime = Math.floor(Date.now() / 1000);

      if (payload.exp && payload.exp < currentTime) {
        this.clearTokens();
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error validating token:", error);
      this.clearTokens();
      return false;
    }
  }

  isTokenExpiringSoon(): boolean {
    const token = this.getAccessToken();
    if (!token) return true;

    try {
      const payload = this.parseJwtPayload(token);
      const currentTime = Math.floor(Date.now() / 1000);
      const bufferTime = AUTH_CONSTANTS.TOKEN_EXPIRY_BUFFER / 1000;

      return payload.exp && payload.exp - currentTime < bufferTime;
    } catch (error) {
      console.error("Error checking token expiry:", error);
      return true;
    }
  }

  private parseJwtPayload(token: string): any {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      throw new Error("Invalid token format");
    }
  }
}

export const tokenManager = TokenManager.getInstance();
