"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import {
  BarChart3,
  Calendar,
  FileText,
  MoreVertical,
  Sparkles,
  Tag,
  Target,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { ChangeCategoryDialog } from "./ChangeCategoryDialog";
import { EnrichmentDetailDialog } from "./EnrichmentDetailDialog";

export type Enrichment = {
  id: string;
  ticker: string;
  title: string;
  summary?: string;
  aiSummary?: string; // AI-generated summary
  confidence?: number; // 0..100
  lastSeenAt?: string; // ISO
  reasonType?: string;
  categories?: string[]; // Reason Types <=> Categories
  sentiment?: number; // -1 to 1
  topic?: string;
};

const getTickerColor = (ticker: string) => {
  const colors = [
    "bg-blue-500 border-blue-400",
    "bg-purple-500 border-purple-400",
    "bg-emerald-500 border-emerald-400",
    "bg-orange-500 border-orange-400",
    "bg-indigo-500 border-indigo-400",
  ];
  const index = ticker.charCodeAt(0) % colors.length;
  return colors[index];
};

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 80) return "bg-emerald-500 border-emerald-400";
  if (confidence >= 60) return "bg-blue-500 border-blue-400";
  if (confidence >= 40) return "bg-orange-500 border-orange-400";
  return "bg-red-500 border-red-400";
};

export function EnrichmentCard({ item }: { item: Enrichment }) {
  const [isChangeCategoryOpen, setIsChangeCategoryOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      return format(date, "dd/MM/yyyy");
    } catch {
      return dateString;
    }
  };

  // Get current category from reasonType or first category
  const currentCategory =
    item.reasonType || (item.categories && item.categories[0]) || "Finances";

  const handleCategoryChange = (newCategory: string) => {
    // TODO: Call API to update category
    console.log(
      `Change Tweet ID: ${item.id} from category ${currentCategory} to ${newCategory}`
    );
    // You can update the item here or call a callback prop
  };

  return (
    <>
      <Card
        className="relative border border-border bg-white dark:bg-card overflow-hidden hover:shadow-md hover:border-[#707FDD] transition-all duration-200 h-full flex flex-col cursor-pointer"
        onClick={() => setIsDetailDialogOpen(true)}
      >
        <CardContent className="p-6 flex flex-col flex-1">
          <div className="space-y-4 flex flex-col flex-1">
            {/* AI Label Header */}
            <div className="flex items-center justify-between pb-2 border-b border-border/50">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">
                  AI Label
                </span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger
                  asChild
                  onClick={(e) => e.stopPropagation()}
                >
                  <button className="h-8 w-8 rounded-lg border border-border/50 bg-muted/50 flex items-center justify-center hover:bg-muted/70 transition-colors">
                    <MoreVertical className="w-4 h-4 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <FileText className="mr-2 h-4 w-4" />
                    Move to reports
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Polymerization
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setIsChangeCategoryOpen(true);
                    }}
                  >
                    <Tag className="mr-2 h-4 w-4" />
                    Change category
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Header with Ticker */}
            <div className="flex items-center justify-between">
              <div
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold ${getTickerColor(
                  item.ticker
                )} text-white shadow-md border`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                {item.ticker}
              </div>
            </div>

            {/* Title */}
            <div className="text-base font-semibold text-foreground line-clamp-2 leading-relaxed">
              {item.title}
            </div>

            {/* Summary */}
            {(item.summary || item.aiSummary) && (
              <div className="text-sm text-muted-foreground line-clamp-3 leading-relaxed flex-1">
                {item.aiSummary || item.summary}
              </div>
            )}

            {/* Metadata Section */}
            <div className="space-y-2.5 pt-3 border-t border-border/50 bg-muted/30 rounded-lg p-3 -mx-3 mt-auto">
              {/* AI Confidence */}
              {typeof item.confidence === "number" && (
                <div className="flex items-center gap-2.5 text-xs">
                  <div
                    className={`p-1.5 rounded-lg border shadow-sm ${getConfidenceColor(
                      item.confidence
                    )}`}
                  >
                    <Target className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="font-medium text-muted-foreground">
                    AI Confidence:
                  </span>
                  <span className="text-foreground font-semibold">
                    {item.confidence}%
                  </span>
                </div>
              )}

              {/* Reason */}
              {item.reasonType && (
                <div className="flex items-center gap-2.5 text-xs">
                  <div className="p-1.5 rounded-lg bg-purple-500/20 border border-purple-400/30 shadow-sm">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="font-medium text-muted-foreground">
                    Reason:
                  </span>
                  <span className="text-foreground font-semibold">
                    {item.reasonType}
                  </span>
                </div>
              )}

              {/* Last seen */}
              {item.lastSeenAt && (
                <div className="flex items-center gap-2.5 text-xs">
                  <div className="p-1.5 rounded-lg bg-blue-500/20 border border-blue-400/30 shadow-sm">
                    <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="font-medium text-muted-foreground">
                    Last seen:
                  </span>
                  <span className="text-foreground font-semibold">
                    {formatDate(item.lastSeenAt)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Category Dialog */}
      <ChangeCategoryDialog
        open={isChangeCategoryOpen}
        onOpenChange={setIsChangeCategoryOpen}
        tweetId={item.id}
        currentCategory={currentCategory}
        onSave={handleCategoryChange}
      />

      {/* Detail Dialog */}
      <EnrichmentDetailDialog
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
        item={item}
        onMoveToReports={() => {
          console.log("Move to reports:", item.id);
          setIsDetailDialogOpen(false);
        }}
        onMoveToPolymerization={() => {
          console.log("Move to polymerization:", item.id);
          setIsDetailDialogOpen(false);
        }}
      />
    </>
  );
}
