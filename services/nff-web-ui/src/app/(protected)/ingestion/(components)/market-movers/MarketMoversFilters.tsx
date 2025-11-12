"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMarketMoversSymbols } from "@/hooks/api";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

export type MarketMoversFiltersState = {
  symbol?: string;
  name?: string;
};

interface MarketMoversFiltersProps {
  initial?: MarketMoversFiltersState;
  onChange: (filters: MarketMoversFiltersState) => void;
  onSearchChange?: (isSearching: boolean) => void;
}

export function MarketMoversFilters({
  initial,
  onChange,
  onSearchChange,
}: MarketMoversFiltersProps) {
  const [filters, setFilters] = useState<MarketMoversFiltersState>(
    initial || {}
  );
  const [isSearching, setIsSearching] = useState(false);

  const { data: gainersSymbols = [], isLoading: isLoadingGainers } =
    useMarketMoversSymbols("gainers", true);
  const { data: losersSymbols = [], isLoading: isLoadingLosers } =
    useMarketMoversSymbols("losers", true);

  const symbolOptions = useMemo(() => {
    const allSymbols = [...gainersSymbols, ...losersSymbols];
    return Array.from(new Set(allSymbols)).sort();
  }, [gainersSymbols, losersSymbols]);

  const isLoadingSymbols = isLoadingGainers || isLoadingLosers;

  const apply = () => {
    setIsSearching(true);
    onSearchChange?.(true);
    onChange(filters);
    setTimeout(() => {
      setIsSearching(false);
      onSearchChange?.(false);
    }, 500);
  };

  const reset = () => {
    const cleared: MarketMoversFiltersState = {};
    setFilters(cleared);
    setIsSearching(true);
    onSearchChange?.(true);
    onChange(cleared);
    setTimeout(() => {
      setIsSearching(false);
      onSearchChange?.(false);
    }, 500);
  };

  const handleNameChange = (value: string) => {
    setFilters((s) => ({ ...s, name: value }));
  };

  return (
    <div className="w-full border border-border rounded-xl p-4 md:p-5 bg-white shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        <div className="md:col-span-3">
          <label className="text-sm font-medium text-foreground mb-2 block">
            Symbol/Ticker
          </label>
          <Select
            value={filters.symbol ?? ""}
            onValueChange={(v) =>
              setFilters((s) => ({ ...s, symbol: v || undefined }))
            }
            disabled={isLoadingSymbols}
          >
            <SelectTrigger className="h-11 bg-background border-border transition-colors">
              <SelectValue placeholder="Choose symbol/tickers" />
            </SelectTrigger>
            <SelectContent>
              {isLoadingSymbols ? (
                <SelectItem value="loading" disabled>
                  Loading...
                </SelectItem>
              ) : (
                symbolOptions.map((symbol) => (
                  <SelectItem key={symbol} value={symbol}>
                    {symbol}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-5">
          <label className="text-sm font-medium text-foreground mb-2 block">
            Company Name
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by company name"
              value={filters.name ?? ""}
              onChange={(e) => handleNameChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  apply();
                }
              }}
              className="h-11 pl-10 bg-background border-border transition-all"
            />
          </div>
        </div>

        <div className="md:col-span-4 flex gap-2 justify-end">
          <Button
            variant="outline"
            className="h-11 px-6 bg-white border-[#707FDD] text-[#707FDD] transition-colors duration-300"
            onClick={reset}
            disabled={isSearching}
          >
            Reset
          </Button>
          <Button
            className="h-11 px-6 bg-[#707FDD] text-white transition-colors"
            onClick={apply}
            disabled={isSearching}
          >
            {isSearching ? "Searching..." : "Apply"}
          </Button>
        </div>
      </div>
    </div>
  );
}
