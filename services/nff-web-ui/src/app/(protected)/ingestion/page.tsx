"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { SidebarIngestion } from "./(components)/SidebarIngestion";
import { Configuration } from "./(components)/configuration/Configuration";
import { Enrichment } from "./(components)/enrichments/EnrichmentCard";
import {
  EnrichmentFilters,
  EnrichmentFiltersState,
} from "./(components)/enrichments/EnrichmentFilters";
import { EnrichmentGrid } from "./(components)/enrichments/EnrichmentGrid";
import { MarketMovers } from "./(components)/market-movers/MarketMovers";
import { RawTweets } from "./(components)/raw-tweets/RawTweets";

type TabType =
  | "configuration"
  | "raw-tweets"
  | "enrichments"
  | "market-movers"
  | "reports"
  | "polymerization";

type TabType =
  | "configuration"
  | "raw-tweets"
  | "enrichments"
  | "market-movers"
  | "reports"
  | "polymerization";

export default function IngestionPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabType>(() => {
    // Load saved tab from URL params on initial render
    const tabParam = searchParams?.get("tab");
    if (
      tabParam &&
      [
        "configuration",
        "raw-tweets",
        "enrichments",
        "market-movers",
        "reports",
        "polymerization",
      ].includes(tabParam)
    ) {
      return tabParam as TabType;
    }
    return "configuration";
  });

  // Update URL when tab changes
  const handleTabChange = (newTab: TabType) => {
    setActiveTab(newTab);
    router.push(`/ingestion?tab=${newTab}`);
  };

  // Enrichment UI state
  const [enrichmentFilters, setEnrichmentFilters] =
    useState<EnrichmentFiltersState>({
      categories: [],
      tickers: [],
    });
  const [enrichmentItems, setEnrichmentItems] = useState<Enrichment[]>([
    {
      id: "c1",
      ticker: "AAPL",
      title: "Upcoming earnings call could signal services growth acceleration",
      summary:
        "Analysts expect double‑digit growth in services; supply chain stable.",
      confidence: 72,
      lastSeenAt: new Date().toISOString(),
      reasonType: "Earnings",
    },
    {
      id: "c2",
      ticker: "NVDA",
      title: "New data center GPU launch rumored for Q1",
      summary: "Channel checks indicate strong demand from hyperscalers.",
      confidence: 64,
      lastSeenAt: new Date().toISOString(),
      reasonType: "Product",
    },
  ]);

  return (
    <div className="min-h-[calc(100vh-78px)] h-[calc(100vh-78px)] flex -mx-6 -mt-6 w-[calc(100%+3rem)]">
      {/* Left Sidebar Navigation */}
      <SidebarIngestion activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-auto">
        <div className="p-8 space-y-6">
          {activeTab === "configuration" && <Configuration />}

          {/* Raw Tweets */}
          {activeTab === "raw-tweets" && <RawTweets />}

          {/* Enrichments */}
          {activeTab === "enrichments" && (
            <>
              <div className="text-center">
                <h1 className="text-3xl font-bold text-foreground">
                  Enrichments
                </h1>
              </div>
              <div className="space-y-4">
                <EnrichmentFilters
                  initial={enrichmentFilters}
                  onChange={(next) => {
                    setEnrichmentFilters(next);
                    // Later: call API with filters to fetch enrichments
                    setEnrichmentItems((prev) => prev);
                  }}
                />
                <EnrichmentGrid items={enrichmentItems} />
              </div>
            </>
          )}

          {/* Market Movers */}
          {activeTab === "market-movers" && <MarketMovers />}

          {/* Reports */}
          {activeTab === "reports" && (
            <>
              <div className="text-center">
                <h1 className="text-3xl font-bold text-foreground">Reports</h1>
              </div>
              <Card className="border-border">
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">
                    Reports functionality coming soon
                  </p>
                </CardContent>
              </Card>
            </>
          )}

          {/* Polymerization */}
          {activeTab === "polymerization" && (
            <>
              <div className="text-center">
                <h1 className="text-3xl font-bold text-foreground">
                  Polymerization
                </h1>
              </div>
              <div className="space-y-4">
                <EnrichmentFilters
                  initial={enrichmentFilters}
                  onChange={(next) => {
                    setEnrichmentFilters(next);
                    // Later: call API with filters to fetch enrichments
                    setEnrichmentItems((prev) => prev);
                  }}
                />
                <EnrichmentGrid items={enrichmentItems} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
