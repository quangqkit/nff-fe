"use client";

import { PaginationControls } from "@/components/ui/pagination-controls";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRawTweets } from "@/hooks/api/useRawTweets";
import { RawTweet } from "@/types/tweets";
import { useEffect, useMemo, useRef, useState } from "react";
import { RawTweetClassificationDialog } from "./RawTweetClassificationDialog";
import { RawTweetsFilters, RawTweetsFiltersState } from "./RawTweetsFilters";
import { RawTweetsList } from "./RawTweetsList";

const PAGE_SIZE_OPTIONS = [20, 50, 100];

export function RawTweets() {
  const [filters, setFilters] = useState<RawTweetsFiltersState>({});
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTweet, setSelectedTweet] = useState<RawTweet | null>(null);

  const { data, isLoading, isFetching, error } = useRawTweets({
    filters,
    pageNumber,
    pageSize,
  });

  const tweets = useMemo<RawTweet[]>(() => data?.data ?? [], [data?.data]);
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const currentPage = pageNumber;
  const loading = isLoading || isFetching;
  const topRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!data) {
      return;
    }

    const computedTotalPages = data.totalPages ?? 0;
    if (computedTotalPages > 0 && pageNumber > computedTotalPages) {
      setPageNumber(computedTotalPages);
    }
  }, [data, pageNumber]);

  // Extract available options from currently loaded tweets
  const availableTickers = useMemo<string[]>(() => {
    const tickers = new Set<string>();
    tweets.forEach((tweet: RawTweet) => {
      tweet.symbols.forEach((symbol: string) => tickers.add(symbol));
    });
    return Array.from(tickers).sort((a, b) => a.localeCompare(b));
  }, [tweets]);

  const availableSchedules = useMemo<{ value: string; label: string }[]>(() => {
    const schedules = new Map<string, string>();
    tweets.forEach((tweet: RawTweet) => {
      if (!tweet.scheduleId) {
        return;
      }
      const label = tweet.scheduleName
        ? `Schedule: ${tweet.scheduleName}`
        : `Schedule ID: ${tweet.scheduleId}`;
      schedules.set(tweet.scheduleId, label);
    });
    return Array.from(schedules.entries()).map(([value, label]) => ({
      value,
      label,
    }));
  }, [tweets]);

  const scrollToTop = () => {
    if (topRef.current) {
      topRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleFiltersChange = (nextFilters: RawTweetsFiltersState) => {
    setFilters(nextFilters);
    setPageNumber(1);
    scrollToTop();
  };

  const handlePageChange = (page: number) => {
    setPageNumber(page);
    scrollToTop();
  };

  const handlePageSizeChange = (value: string) => {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      setPageSize(parsed);
      setPageNumber(1);
      scrollToTop();
    }
  };

  const handleTweetSelect = (tweet: RawTweet) => {
    setSelectedTweet(tweet);
    setDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setSelectedTweet(null);
    }
  };

  const handleClassificationSubmit = (tweet: RawTweet, prompt: string) => {
    // TODO: integrate with classification workflow
    console.log("Submit classification prompt", { tweetId: tweet.id, prompt });
    setDialogOpen(false);
    setSelectedTweet(null);
  };

  const showingStart = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const showingEnd =
    total === 0 ? 0 : Math.min(showingStart + tweets.length - 1, total);

  return (
    <div ref={topRef} className="space-y-6 max-w-[1400px] mx-auto px-4 pb-10">
      <header className="flex flex-col gap-4">
        <div className="text-center md:text-left">
          <h1 className="text-3xl font-bold text-foreground">
            Raw Tweets Dashboard
          </h1>
        </div>
        <RawTweetsFilters
          initial={filters}
          onChange={handleFiltersChange}
          availableTickers={availableTickers}
          availableSchedules={availableSchedules}
        />
      </header>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          Error loading data:{" "}
          {error instanceof Error ? error.message : "Unknown error"}
        </div>
      )}

      <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-muted-foreground">
          {loading && total === 0
            ? "Loading tweets..."
            : `Showing ${showingStart}–${showingEnd} of ${total} tweets`}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows per page</span>
          <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
            <SelectTrigger className="h-9 w-[110px]">
              <SelectValue placeholder={String(pageSize)} />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      <RawTweetsList
        tweets={tweets}
        loading={loading}
        onTweetSelect={handleTweetSelect}
      />

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        className="border-t border-border pt-4"
      />

      <RawTweetClassificationDialog
        open={dialogOpen}
        tweet={selectedTweet}
        onOpenChange={handleDialogOpenChange}
        onSubmit={handleClassificationSubmit}
      />
    </div>
  );
}
