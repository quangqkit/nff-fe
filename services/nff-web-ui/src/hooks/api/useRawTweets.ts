"use client";

import { RawTweet, RawTweetsFilters } from "@/types/tweets";
import { useQuery } from "@tanstack/react-query";

// Query Keys
export const rawTweetsKeys = {
  all: ["raw-tweets"] as const,
  lists: () => [...rawTweetsKeys.all, "list"] as const,
  list: (filters?: RawTweetsFilters) =>
    [...rawTweetsKeys.lists(), filters] as const,
};

// Mock data
const mockRawTweets: RawTweet[] = [
  {
    id: 1,
    scheduleId: "schedule-1",
    runId: "run-001",
    tweetId: "1234567890",
    source: "lobstr",
    authorHandle: "@tech_analyst",
    text: "Breaking: AAPL announces major AI partnership that could reshape the smartphone industry. Analysts are bullish on the news.",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    fetchedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
    isReply: false,
    isRetweet: false,
    symbols: ["AAPL"],
    scheduleName: "Service 03:00 IL",
    publicMetrics: {
      retweetCount: 1250,
      likeCount: 8900,
      replyCount: 340,
    },
  },
  {
    id: 2,
    scheduleId: "schedule-2",
    runId: "run-002",
    tweetId: "1234567891",
    source: "lobstr",
    authorHandle: "@market_watcher",
    text: "NVDA earnings preview: Strong data center demand expected, but supply chain concerns remain. Key metrics to watch.",
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    fetchedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
    isReply: false,
    isRetweet: false,
    symbols: ["NVDA"],
    scheduleName: "Service 11:00 IL",
    publicMetrics: {
      retweetCount: 980,
      likeCount: 5600,
      replyCount: 210,
    },
  },
  {
    id: 3,
    scheduleId: "schedule-1",
    runId: "run-003",
    tweetId: "1234567892",
    source: "lobstr",
    authorHandle: "@finance_news",
    text: "TSLA reports record delivery numbers for Q4, beating estimates. Stock surges in after-hours trading.",
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    fetchedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
    isReply: false,
    isRetweet: false,
    symbols: ["TSLA"],
    scheduleName: "Service 03:00 IL",
    publicMetrics: {
      retweetCount: 2100,
      likeCount: 12400,
      replyCount: 780,
    },
  },
  {
    id: 4,
    scheduleId: "schedule-3",
    runId: "run-004",
    tweetId: "1234567893",
    source: "lobstr",
    authorHandle: "@stocks_insider",
    text: "MSFT Azure revenue growth accelerates, cloud adoption continues. Partnership announcements expected this week.",
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
    fetchedAt: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(), // 7 hours ago
    isReply: false,
    isRetweet: false,
    symbols: ["MSFT", "AZURE"],
    scheduleName: "Service 14:00 IL",
    publicMetrics: {
      retweetCount: 650,
      likeCount: 4200,
      replyCount: 190,
    },
  },
  {
    id: 5,
    scheduleId: "schedule-4",
    runId: "run-005",
    tweetId: "1234567894",
    source: "lobstr",
    authorHandle: "@investment_strategy",
    text: "AMZN AWS expansion into new regions signals aggressive growth strategy. Competition heating up in cloud space.",
    createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(), // 10 hours ago
    fetchedAt: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString(), // 9 hours ago
    isReply: false,
    isRetweet: false,
    symbols: ["AMZN"],
    scheduleName: "Service 15:33 IL",
    publicMetrics: {
      retweetCount: 890,
      likeCount: 6700,
      replyCount: 320,
    },
  },
  {
    id: 6,
    scheduleId: "schedule-2",
    runId: "run-006",
    tweetId: "1234567895",
    source: "lobstr",
    authorHandle: "@tech_insider",
    text: "GOOGL AI developments: New language model capabilities revealed. Market impact could be significant.",
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
    fetchedAt: new Date(Date.now() - 11 * 60 * 60 * 1000).toISOString(), // 11 hours ago
    isReply: false,
    isRetweet: false,
    symbols: ["GOOGL"],
    scheduleName: "Service 11:00 IL",
    publicMetrics: {
      retweetCount: 1450,
      likeCount: 9800,
      replyCount: 450,
    },
  },
  {
    id: 7,
    scheduleId: "schedule-1",
    runId: "run-007",
    tweetId: "1234567896",
    source: "lobstr",
    authorHandle: "@market_analyst",
    text: "Earnings season kicks off with AAPL, MSFT, and NVDA reporting this week. Expectations are high for tech sector.",
    createdAt: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(), // 14 hours ago
    fetchedAt: new Date(Date.now() - 13 * 60 * 60 * 1000).toISOString(), // 13 hours ago
    isReply: false,
    isRetweet: false,
    symbols: ["AAPL", "MSFT", "NVDA"],
    scheduleName: "Service 03:00 IL",
    publicMetrics: {
      retweetCount: 2100,
      likeCount: 15600,
      replyCount: 890,
    },
  },
  {
    id: 8,
    scheduleId: "schedule-3",
    runId: "run-008",
    tweetId: "1234567897",
    source: "lobstr",
    authorHandle: "@trading_signals",
    text: "TSLA production numbers exceed expectations. Manufacturing efficiency improvements driving margins higher.",
    createdAt: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString(), // 16 hours ago
    fetchedAt: new Date(Date.now() - 15 * 60 * 60 * 1000).toISOString(), // 15 hours ago
    isReply: false,
    isRetweet: false,
    symbols: ["TSLA"],
    scheduleName: "Service 14:00 IL",
    publicMetrics: {
      retweetCount: 3200,
      likeCount: 18900,
      replyCount: 1120,
    },
  },
];

// Filter function for mock data
const filterTweets = (
  tweets: RawTweet[],
  filters?: RawTweetsFilters
): RawTweet[] => {
  let filtered = [...tweets];

  if (filters?.name) {
    const searchTerm = filters.name.toLowerCase();
    filtered = filtered.filter(
      (tweet) =>
        tweet.text.toLowerCase().includes(searchTerm) ||
        tweet.authorHandle?.toLowerCase().includes(searchTerm)
    );
  }

  if (filters?.ticker) {
    filtered = filtered.filter((tweet) =>
      tweet.symbols.includes(filters.ticker!)
    );
  }

  if (filters?.schedule) {
    filtered = filtered.filter(
      (tweet) => tweet.scheduleId === filters.schedule
    );
  }

  if (filters?.dateRange?.from) {
    filtered = filtered.filter(
      (tweet) => new Date(tweet.createdAt) >= filters.dateRange!.from!
    );
  }

  if (filters?.dateRange?.to) {
    filtered = filtered.filter(
      (tweet) => new Date(tweet.createdAt) <= filters.dateRange!.to!
    );
  }

  // Categories filter would need additional metadata, skipping for now
  if (filters?.categories && filters.categories.length > 0) {
    // Mock: filter by symbols or schedule for now
    // In real implementation, this would use category metadata
  }

  return filtered;
};

// Hook to fetch raw tweets from database
export const useRawTweets = (filters?: RawTweetsFilters, enabled = true) => {
  return useQuery<RawTweet[], Error>({
    queryKey: rawTweetsKeys.list(filters),
    queryFn: async () => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Apply filters to mock data
      return filterTweets(mockRawTweets, filters);
    },
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};
