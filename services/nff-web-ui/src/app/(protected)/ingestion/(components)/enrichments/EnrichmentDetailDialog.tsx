"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { format } from "date-fns";
import { Enrichment } from "./EnrichmentCard";

interface EnrichmentDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Enrichment;
  onMoveToReports?: () => void;
  onMoveToPolymerization?: () => void;
}

export function EnrichmentDetailDialog({
  open,
  onOpenChange,
  item,
  onMoveToReports,
  onMoveToPolymerization,
}: EnrichmentDetailDialogProps) {
  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      return format(date, "dd/MM/yyyy HH:mm");
    } catch {
      return dateString;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      return format(date, "dd/MM/yyyy");
    } catch {
      return dateString;
    }
  };

  // Mock data - replace with actual data from item
  const tweetId = item.id || "---";
  const combinedId = `CATALYST-X${item.id?.slice(-6) || "858541"}`;
  const originalTweetPreview =
    item.title || item.summary || "[...Title or short version of tweet...]";
  const financialHighlights =
    item.summary || item.aiSummary || "No financial highlights available";
  const createdAt = item.lastSeenAt || new Date().toISOString();
  const fetchedAt = item.lastSeenAt || new Date().toISOString();
  const scheduleId = "---";
  const scheduleName = "---";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="mt-5 w-full">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground border-b pb-2 w-full">
              Tweets ID:{" "}
              <span className="text-foreground font-medium">{tweetId}</span>
            </div>
          </div>
        </div>
        <div className="space-y-6">
          {/* Main Content - 2 Columns */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold bg-emerald-500 text-white border border-emerald-400">
            Combined: {combinedId}
          </div>
          <div className="grid grid-cols-2 gap-6 border-l border-r border-border/50">
            {/* Left Column */}
            <div className="space-y-4 pl-6">
              {/* Financial Highlights Box */}
              <div className="p-4 border rounded-lg bg-muted/50 dark:bg-muted/30 space-y-3">
                <div className="text-sm font-semibold text-foreground mb-2">
                  {item.ticker && `${item.ticker} | `}
                  {item.title || "Financial Highlights"}
                </div>
                <div className="text-sm text-foreground space-y-1.5">
                  {financialHighlights.split("\n").map((line, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-muted-foreground">•</span>
                      <span>{line || financialHighlights}</span>
                    </div>
                  ))}
                  {!financialHighlights.includes("\n") && (
                    <div className="flex items-start gap-2">
                      <span className="text-muted-foreground">•</span>
                      <span className="text-foreground">
                        {financialHighlights}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* AI-Generated Metrics */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    Reason Type → category:
                  </span>
                  <span className="text-foreground font-medium">
                    {item.categories && item.categories.length > 0
                      ? `[${item.categories.join(", ")}]`
                      : item.reasonType
                      ? `[${item.reasonType}]`
                      : "[]"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">AI Confidence:</span>
                  <span className="text-foreground font-medium">
                    {item.confidence ? `${item.confidence}%` : "??"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Sentiment:</span>
                  <span className="text-foreground font-medium">
                    {typeof item.sentiment === "number"
                      ? `${
                          item.sentiment > 0 ? "+" : ""
                        }${item.sentiment.toFixed(1)}`
                      : "??"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Topic:</span>
                  <span className="text-foreground font-medium">
                    {item.topic || "??"}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4 text-sm pr-6">
              {/* Original Tweet Preview */}
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  Original tweet preview:
                </div>
                <div className="p-3 border rounded-md bg-muted/30 text-sm text-foreground min-h-[80px] whitespace-pre-wrap">
                  {originalTweetPreview}
                </div>
              </div>

              {/* Timestamp Information */}
              <div className="space-y-2">
                <div>
                  <span className="text-muted-foreground">Create at UTC:</span>{" "}
                  <span className="text-foreground font-medium">
                    {formatDateTime(createdAt)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Fetch at UTC:</span>{" "}
                  <span className="text-foreground font-medium">
                    {formatDate(fetchedAt)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    Schedule ID - Name:
                  </span>{" "}
                  <span className="text-foreground font-medium">
                    {scheduleId} - {scheduleName}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between border-t pt-4 sm:flex-row w-full">
            <div className="flex gap-4">
              <button
                onClick={onMoveToReports}
                className="text-red-600 hover:text-red-700 underline text-sm font-medium"
              >
                Move to reports
              </button>
              <button
                onClick={onMoveToPolymerization}
                className="text-emerald-600 hover:text-emerald-700 underline text-sm font-medium"
              >
                Move to polymerization
              </button>
            </div>
            <div>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
