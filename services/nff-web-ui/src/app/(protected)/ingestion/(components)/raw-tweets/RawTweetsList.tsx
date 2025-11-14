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
  onTweetSelect?: (tweet: RawTweet) => void;
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

export function RawTweetsList({
  tweets,
  loading,
  onTweetSelect,
}: RawTweetsListProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3, 4].map((i) => (
          <Card
            key={i}
            className="border-border/40 bg-white/80 backdrop-blur-sm rounded-3xl shadow-sm"
          >
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div className="h-8 w-20 bg-muted rounded-full animate-pulse" />
                <div className="h-4 w-16 bg-muted rounded animate-pulse" />
              </div>
              <div className="space-y-3">
                <div className="h-5 bg-muted rounded animate-pulse" />
                <div className="h-5 bg-muted rounded animate-pulse w-5/6" />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/30">
                {[1, 2, 3, 4].map((s) => (
                  <div
                    key={s}
                    className="h-12 bg-muted rounded-xl animate-pulse"
                  />
                ))}
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {tweets.map((tweet) => {
        const handleCardClick = () => {
          onTweetSelect?.(tweet);
        };

        const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleCardClick();
          }
        };

        return (
          <Card
            key={tweet.id}
            role={onTweetSelect ? "button" : undefined}
            tabIndex={onTweetSelect ? 0 : undefined}
            onClick={onTweetSelect ? handleCardClick : undefined}
            onKeyDown={onTweetSelect ? handleKeyDown : undefined}
            className="group relative border border-border/30 bg-white/90 dark:bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/60 focus:ring-offset-2 cursor-pointer"
          >
            <CardContent className="p-5 flex flex-col gap-5 h-full">
              <header className="flex items-center justify-between gap-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 text-white text-[11px] font-semibold shadow-sm">
                  <Sparkles className="w-3 h-3" />#{tweet.id}
                </span>
                {tweet.authorHandle && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted border border-border/50 text-xs font-medium text-muted-foreground">
                    <User className="w-3 h-3" />
                    {tweet.authorHandle}
                  </span>
                )}
              </header>

              <h2 className="text-sm font-semibold text-foreground leading-relaxed line-clamp-2">
                {tweet.text || "[No tweet body provided]"}
              </h2>

              <section className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-600">
                  <Clock className="w-3 h-3" />
                  {formatDate(tweet.createdAt)}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600">
                  <Calendar className="w-3 h-3" />
                  {formatDateOnly(tweet.fetchedAt)}
                </span>
              </section>

              {tweet.symbols && tweet.symbols.length > 0 && (
                <section className="flex flex-wrap gap-1.5">
                  {tweet.symbols.slice(0, 5).map((symbol, index) => (
                    <span
                      key={`${tweet.id}-${symbol}`}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold ${getSymbolColors(
                        index
                      )} text-white shadow-sm`}
                    >
                      <TrendingUp className="w-3 h-3" />
                      {symbol}
                    </span>
                  ))}
                  {tweet.symbols.length > 5 && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold bg-muted text-muted-foreground">
                      +{tweet.symbols.length - 5}
                    </span>
                  )}
                </section>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
