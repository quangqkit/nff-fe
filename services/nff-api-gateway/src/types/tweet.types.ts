export type TweetCategory =
  | 'Macro'
  | 'Sector'
  | 'Earnings'
  | 'Analyst'
  | 'Corporate'
  | 'Options';

export interface TweetResponse {
  id: number;
  tweetId: string;
  category: TweetCategory;
  tickers: string[];
  sectors: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ClassifyTweetsResponse {
  count: number;
  items: TweetResponse[];
}
