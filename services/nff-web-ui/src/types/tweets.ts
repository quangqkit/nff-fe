export interface RawTweet {
  id: number;
  scheduleId: string;
  runId: string;
  tweetId: string;
  externalId?: string;
  source: string;
  authorId?: string;
  authorHandle?: string;
  text: string;
  lang?: string;
  createdAt: string; // ISO date string
  fetchedAt: string; // ISO date string
  isReply: boolean;
  isRetweet: boolean;
  publicMetrics?: {
    retweetCount?: number;
    likeCount?: number;
    replyCount?: number;
    quoteCount?: number;
  };
  urls?: string[];
  symbols: string[];
  // Computed fields for display
  scheduleName?: string;
}

export interface RawTweetsFilters {
  categories?: string[];
  name?: string;
  dateRange?: {
    from?: Date;
    to?: Date;
  };
  ticker?: string;
  schedule?: string;
}
