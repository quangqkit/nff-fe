"use client";

import { useRawTweets } from "@/hooks/api/useRawTweets";
import { useMemo, useState } from "react";
import { RawTweetsFilters, RawTweetsFiltersState } from "./RawTweetsFilters";
import { RawTweetsList } from "./RawTweetsList";

export function RawTweets() {
  const [filters, setFilters] = useState<RawTweetsFiltersState>({});
  const { data: tweets = [], isLoading, error } = useRawTweets(filters, true);

  // Extract available options from tweets data
  const availableTickers = useMemo(() => {
    const tickers = new Set<string>();
    tweets.forEach((tweet) => {
      tweet.symbols.forEach((symbol) => tickers.add(symbol));
    });
    return Array.from(tickers).sort();
  }, [tweets]);

  const availableSchedules = useMemo(() => {
    const schedules = new Map<string, string>();
    tweets.forEach((tweet) => {
      if (tweet.scheduleId && tweet.scheduleName) {
        schedules.set(tweet.scheduleId, tweet.scheduleName);
      }
    });
    return Array.from(schedules.entries()).map(([value, label]) => ({
      value,
      label: `Schedule: ${label}`,
    }));
  }, [tweets]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground">
          List of raw tweets
        </h1>
      </div>

      <RawTweetsFilters
        initial={filters}
        onChange={setFilters}
        availableTickers={availableTickers}
        availableSchedules={availableSchedules}
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          Error loading data:{" "}
          {error instanceof Error ? error.message : "Unknown error"}
        </div>
      )}

      <RawTweetsList tweets={tweets} loading={isLoading} />
    </div>
  );
}
