"use client";

import { Column, DataTable } from "@/components/ui/data-table";
import { TradingViewStock } from "@/types";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

type SortDirection = "asc" | "desc" | null;

interface MarketMoversTableProps {
  title: string;
  data: TradingViewStock[];
  type: "gainers" | "losers";
  filters?: {
    symbol?: string;
    name?: string;
  };
  loading?: boolean;
}

export function MarketMoversTable({
  title,
  data,
  type,
  filters = {},
  loading = false,
}: MarketMoversTableProps) {
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const parsePercentage = (value: string): number => {
    if (!value) return 0;
    const cleaned = value.replace(/[+%]/g, "").trim();
    return parseFloat(cleaned) || 0;
  };

  const filteredData = useMemo(() => {
    let result = data.filter((item) => {
      if (filters.symbol && item.symbol !== filters.symbol) return false;
      if (
        filters.name &&
        !item.companyName.toLowerCase().includes(filters.name.toLowerCase())
      )
        return false;
      return true;
    });

    if (sortDirection) {
      result = [...result].sort((a, b) => {
        const aValue = parsePercentage(a.preMarketChangePercent);
        const bValue = parsePercentage(b.preMarketChangePercent);
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      });
    }

    return result;
  }, [data, filters, sortDirection]);

  const handleSortClick = useCallback(() => {
    setSortDirection((prev) => {
      if (prev === null) {
        return "desc";
      } else if (prev === "desc") {
        return "asc";
      } else {
        return null;
      }
    });
  }, []);

  const textColor = type === "gainers" ? "text-green-600" : "text-red-600";

  const sortHeader = useMemo(
    () => (
      <div
        className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity font-sans select-none"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleSortClick();
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleSortClick();
          }
        }}
      >
        % Pre Market Change
        {sortDirection === "desc" ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : sortDirection === "asc" ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground opacity-40" />
        )}
      </div>
    ),
    [sortDirection, handleSortClick]
  );

  const columns: Column<TradingViewStock>[] = useMemo(
    () => [
      {
        key: "symbol",
        header: "Symbol",
        width: "100px",
        className: "w-[100px] font-semibold font-sans",
        render: (item) => (
          <span className="font-semibold font-sans text-foreground">
            {item.symbol}
          </span>
        ),
      },
      {
        key: "companyName",
        header: "Company Name",
        className: "min-w-[200px]",
        render: (item) => (
          <div
            className="truncate font-sans text-foreground"
            title={item.companyName}
          >
            {item.companyName}
          </div>
        ),
      },
      {
        key: "preMarketChangePercent",
        header: sortHeader,
        width: "220px",
        className: "w-[220px]",
        sortable: true,
        render: (item) => (
          <span className={`${textColor} font-semibold font-sans`}>
            {item.preMarketChangePercent}
          </span>
        ),
      },
      {
        key: "marketCap",
        header: "Market Cap",
        width: "160px",
        className: "w-[160px]",
        render: (item) => (
          <span className="font-sans text-foreground">{item.marketCap}</span>
        ),
      },
    ],
    [textColor, sortHeader]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className={`text-lg font-semibold ${textColor}`}>{title}</h2>
        <span className="text-sm text-muted-foreground">
          ({filteredData.length} items)
        </span>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <DataTable
          data={filteredData}
          columns={columns}
          emptyMessage="No data available"
          className="bg-card"
          loading={loading}
        />
      </div>
    </div>
  );
}
