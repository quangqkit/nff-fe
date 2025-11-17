export interface TweetResponse {
  id: number;
  tweetId: string;
  categories: string[];
  subCategories: Record<string, string[]> | null;
  tickers: string[];
  sectors: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ClassifyTweetsResponse {
  count: number;
  items: TweetResponse[];
}

export interface GetTweetsResponse {
  data: TweetResponse[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}
