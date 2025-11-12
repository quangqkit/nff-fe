"use client";

import { Card, CardContent } from "@/components/ui/card";
import { RawTweet } from "@/types/tweets";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  Hash,
  Sparkles,
  TrendingUp,
  User,
} from "lucide-react";

interface RawTweetsListProps {
  tweets: RawTweet[];
  loading?: boolean;
}

const getSymbolColors = (index: number) => {
  const colors = [
    "bg-blue-500 border-blue-400",
    "bg-purple-500 border-purple-400",
    "bg-emerald-500 border-emerald-400",
    "bg-orange-500 border-orange-400",
    "bg-indigo-500 border-indigo-400",
  ];
  return colors[index % colors.length];
};

export function RawTweetsList({ tweets, loading }: RawTweetsListProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-border/50 bg-card overflow-hidden">
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-20 bg-primary/20 rounded-lg"></div>
                  <div className="h-4 w-24 bg-muted rounded"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-full"></div>
                  <div className="h-4 bg-muted rounded w-5/6"></div>
                </div>
                <div className="space-y-2 pt-3 border-t border-border/50">
                  <div className="h-3 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (tweets.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-6">
          <Hash className="w-10 h-10 text-primary" />
        </div>
        <p className="text-xl font-semibold text-foreground mb-2">
          No raw tweets found
        </p>
        <p className="text-sm text-muted-foreground">
          Try adjusting your filters to see more results
        </p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "dd/MM/yyyy HH:mm:ss");
    } catch {
      return dateString;
    }
  };

  const formatDateOnly = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "dd/MM/yyyy");
    } catch {
      return dateString;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {tweets.map((tweet) => (
        <Card
          key={tweet.id}
          className="relative border border-border bg-white dark:bg-card overflow-hidden hover:shadow-md hover:border-[#707FDD] transition-all duration-200"
        >
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Header with ID and Author */}
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold">#{tweet.id}</span>
                </div>
                {tweet.authorHandle && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/50 border border-border/50">
                    <User className="w-3 h-3 text-primary/70" />
                    <span className="text-xs font-medium text-foreground/80">
                      {tweet.authorHandle}
                    </span>
                  </div>
                )}
              </div>

              {/* Tweet Text */}
              <div className="text-base font-semibold text-foreground line-clamp-3 leading-relaxed">
                {tweet.text || "[...Title or short version of tweet...]"}
              </div>

              {/* Metadata Section */}
              <div className="space-y-2.5 pt-3 border-t border-border/50 bg-primary/5 rounded-lg p-3 -mx-3">
                <div className="flex items-center gap-2.5 text-xs">
                  <div className="p-1.5 rounded-lg bg-blue-500/20 border border-blue-400/30 shadow-sm">
                    <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="font-medium text-muted-foreground">
                    Created:
                  </span>
                  <span className="text-foreground font-semibold">
                    {formatDate(tweet.createdAt)}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 text-xs">
                  <div className="p-1.5 rounded-lg bg-emerald-500/20 border border-emerald-400/30 shadow-sm">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="font-medium text-muted-foreground">
                    Fetched:
                  </span>
                  <span className="text-foreground font-semibold">
                    {formatDateOnly(tweet.fetchedAt)}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 text-xs pt-1">
                  <div className="p-1.5 rounded-lg bg-purple-500/20 border border-purple-400/30 shadow-sm">
                    <TrendingUp className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="font-medium text-muted-foreground">
                    Schedule:
                  </span>
                  <span className="text-foreground font-semibold">
                    {tweet.scheduleId}
                    {tweet.scheduleName ? ` • ${tweet.scheduleName}` : ""}
                  </span>
                </div>
              </div>

              {/* Symbols */}
              {tweet.symbols && tweet.symbols.length > 0 && (
                <div className="flex gap-2 flex-wrap pt-1">
                  {tweet.symbols.map((symbol, symbolIndex) => (
                    <span
                      key={symbol}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${getSymbolColors(
                        symbolIndex
                      )} text-white shadow-md border`}
                    >
                      <TrendingUp className="w-3 h-3" />
                      {symbol}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
