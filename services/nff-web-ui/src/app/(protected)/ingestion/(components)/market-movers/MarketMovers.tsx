"use client";

import { Button } from "@/components/ui/button";
import {
  useMarketMovers,
  useMarketMoversSearch,
  useRefreshMarketMovers,
} from "@/hooks/api";
import { RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import {
  MarketMoversFilters,
  MarketMoversFiltersState,
} from "./MarketMoversFilters";
import { MarketMoversTable } from "./MarketMoversTable";

export function MarketMovers() {
  const [filters, setFilters] = useState<MarketMoversFiltersState>({});
  const [isSearching, setIsSearching] = useState(false);
  const { gainers, losers, isLoading, isFetching, error } =
    useMarketMovers(true);
  const { refreshAll } = useRefreshMarketMovers();

  const { data: searchGainers = [], isLoading: isLoadingSearchGainers } =
    useMarketMoversSearch("gainers", filters.name || "", isSearching);
  const { data: searchLosers = [], isLoading: isLoadingSearchLosers } =
    useMarketMoversSearch("losers", filters.name || "", isSearching);

  const handleRefresh = async () => {
    await refreshAll();
  };

  const isRefreshing = isFetching && !isLoading;

  const filteredGainers = useMemo(() => {
    if (isSearching && filters.name) {
      return searchGainers.filter((item) => {
        if (filters.symbol && item.symbol !== filters.symbol) return false;
        return true;
      });
    }
    return gainers.filter((item) => {
      if (filters.symbol && item.symbol !== filters.symbol) return false;
      if (
        filters.name &&
        !item.companyName.toLowerCase().includes(filters.name.toLowerCase())
      )
        return false;
      return true;
    });
  }, [gainers, searchGainers, filters, isSearching]);

  const filteredLosers = useMemo(() => {
    if (isSearching && filters.name) {
      return searchLosers.filter((item) => {
        if (filters.symbol && item.symbol !== filters.symbol) return false;
        return true;
      });
    }
    return losers.filter((item) => {
      if (filters.symbol && item.symbol !== filters.symbol) return false;
      if (
        filters.name &&
        !item.companyName.toLowerCase().includes(filters.name.toLowerCase())
      )
        return false;
      return true;
    });
  }, [losers, searchLosers, filters, isSearching]);

  const isLoadingTable =
    isSearching && (isLoadingSearchGainers || isLoadingSearchLosers);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground">
          List of gainers and losers
        </h1>
      </div>

      <MarketMoversFilters
        initial={filters}
        onChange={setFilters}
        onSearchChange={setIsSearching}
      />

      <div className="flex justify-end">
        <Button
          onClick={handleRefresh}
          variant="outline"
          disabled={isRefreshing || isLoading}
          className="gap-2"
        >
          <RefreshCw
            className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          Error loading data:{" "}
          {error instanceof Error ? error.message : "Unknown error"}
        </div>
      )}

      <div className="space-y-8">
        <MarketMoversTable
          title="Gainers"
          data={filteredGainers}
          type="gainers"
          filters={filters}
          loading={isRefreshing || isLoadingTable}
        />

        <div className="border-t border-border my-6" />

        <MarketMoversTable
          title="Losers"
          data={filteredLosers}
          type="losers"
          filters={filters}
          loading={isRefreshing || isLoadingTable}
        />
      </div>
    </div>
  );
}
