"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { RawTweet } from "@/types/tweets";
import { format } from "date-fns";
import { Calendar, Clock, Hash, User } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface RawTweetClassificationDialogProps {
  open: boolean;
  tweet: RawTweet | null;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (tweet: RawTweet, prompt: string) => void;
  submitting?: boolean;
  onStop?: (tweet: RawTweet | null) => void;
}

const formatLongDate = (value?: string) => {
  if (!value) {
    return "-";
  }
  try {
    return format(new Date(value), "dd/MM/yyyy HH:mm:ss");
  } catch {
    return value;
  }
};

const formatShortDate = (value?: string) => {
  if (!value) {
    return "-";
  }
  try {
    return format(new Date(value), "dd/MM/yyyy");
  } catch {
    return value;
  }
};

export function RawTweetClassificationDialog({
  open,
  tweet,
  onOpenChange,
  onSubmit,
  submitting = false,
  onStop,
}: RawTweetClassificationDialogProps) {
  const [prompt, setPrompt] = useState("");

  useEffect(() => {
    if (!open) {
      setPrompt("");
      return;
    }
    setPrompt("");
  }, [open, tweet?.id]);

  const canSubmit = useMemo(() => {
    return Boolean(tweet && prompt.trim().length > 0 && !submitting);
  }, [prompt, submitting, tweet]);

  const handleSubmit = () => {
    if (!tweet || !canSubmit) {
      return;
    }
    onSubmit?.(tweet, prompt.trim());
  };

  const handleStop = () => {
    if (onStop) {
      onStop(tweet ?? null);
    } else {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl gap-0 overflow-hidden rounded-xl border-none bg-gradient-to-br from-indigo-100/80 via-white to-sky-100/80 p-0 shadow-2xl dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
        <div className="space-y-6 bg-white/80 p-6 md:p-8 backdrop-blur-sm dark:bg-slate-950/60">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-slate-900 dark:text-white">
              Classify Tweet
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-6 lg:grid-cols-[1.4fr_minmax(0,1fr)]">
            <section className="rounded-2xl border border-indigo-100/70 bg-white/90 p-5 shadow-md dark:border-slate-800 dark:bg-slate-950/80">
              {tweet ? (
                <div className="flex flex-col gap-4">
                  <header className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
                        <Hash className="h-3 w-3" />
                        Original tweet preview
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        ID #{tweet.id}
                      </p>
                    </div>
                    {tweet.authorHandle && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground">
                        <User className="h-3 w-3" />
                        {tweet.authorHandle}
                      </span>
                    )}
                  </header>

                  <article className="space-y-3 rounded-lg bg-background/70 p-4 text-sm leading-relaxed text-foreground shadow-inner">
                    <p className="font-medium">
                      {tweet.text || "[No tweet body provided]"}
                    </p>
                    {tweet.symbols && tweet.symbols.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {tweet.symbols.slice(0, 6).map((symbol) => (
                          <span
                            key={`${tweet.id}-${symbol}`}
                            className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-indigo-700"
                          >
                            {symbol}
                          </span>
                        ))}
                        {tweet.symbols.length > 6 && (
                          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-indigo-600">
                            +{tweet.symbols.length - 6}
                          </span>
                        )}
                      </div>
                    )}
                  </article>

                  <dl className="grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
                    <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-background/60 px-3 py-2">
                      <Clock className="h-3.5 w-3.5 text-primary" />
                      <div>
                        <dt className="font-semibold uppercase tracking-wide">
                          Created at (UTC)
                        </dt>
                        <dd className="font-medium text-foreground">
                          {formatLongDate(tweet.createdAt)}
                        </dd>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-background/60 px-3 py-2">
                      <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                      <div>
                        <dt className="font-semibold uppercase tracking-wide">
                          Fetched at (UTC)
                        </dt>
                        <dd className="font-medium text-foreground">
                          {formatShortDate(tweet.fetchedAt)}
                        </dd>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-background/60 px-3 py-2 md:col-span-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Schedule ID
                        </span>
                        <span className="font-medium text-foreground">
                          {tweet.scheduleId || "—"}
                        </span>
                      </div>
                      {tweet.scheduleName && (
                        <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
                          {tweet.scheduleName}
                        </span>
                      )}
                    </div>
                  </dl>
                </div>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Select a tweet to preview.
                </div>
              )}
            </section>

            <section className="flex h-full flex-col gap-4 rounded-2xl border border-sky-100/80 bg-sky-50/70 p-5 shadow-md dark:border-slate-800 dark:bg-slate-950/70">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Enter prompt to classify
                </p>
                <p className="text-xs text-muted-foreground">
                  Provide classification instructions or context for the model.
                </p>
              </div>
              <Textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Write your classification prompt..."
                className="min-h-[180px] resize-y border-sky-200/80 focus-visible:ring-sky-500/40 dark:border-slate-800"
                disabled={!tweet || submitting}
              />
              <div className="text-xs text-muted-foreground">
                {prompt.trim().length}/
                <span className="text-muted-foreground/70">unlimited</span>
              </div>
              <DialogFooter className="mt-auto flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="border-destructive/40 bg-destructive/5 text-destructive hover:bg-destructive/15 hover:text-destructive"
                  onClick={handleStop}
                  disabled={!tweet || submitting}
                >
                  Stop/Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="bg-indigo-500 text-white hover:bg-indigo-500/90 disabled:bg-indigo-300"
                >
                  {submitting ? "Submitting..." : "Submit"}
                </Button>
              </DialogFooter>
            </section>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
