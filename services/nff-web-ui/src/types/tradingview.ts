// TradingView API Types
export interface TradingViewStock {
  symbol: string;
  companyName: string;
  preMarketChangePercent: string;
  marketCap: string;
}

export interface TradingViewApiResponse {
  data: TradingViewStock[];
  timestamp: string;
  source: string;
}

export interface TradingViewGainersResponse extends TradingViewApiResponse {
  type: "gainers";
}

export interface TradingViewLosersResponse extends TradingViewApiResponse {
  type: "losers";
}

export type TradingViewResponse =
  | TradingViewGainersResponse
  | TradingViewLosersResponse;

// Service Types for Ingestion
export interface IngestionService {
  id: string;
  primaryText: string;
  secondaryText: string;
  isRunning: boolean;
  apiEndpoint?: string;
  data?: TradingViewStock[];
  lastFetched?: string;
  error?: string;
}

export interface IngestionServiceGroup {
  title: string;
  services: IngestionService[];
}

export interface IngestionState {
  services: IngestionServiceGroup[];
  activeTab: "configuration" | "query-events" | "catalyst-merge";
  isLoading: boolean;
  error?: string;
}
