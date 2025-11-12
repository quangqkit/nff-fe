import { baseApi } from "@/lib/api/base";
import { TradingViewStock } from "@/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export const marketMoversKeys = {
  all: ["market-movers"] as const,
  gainers: () => [...marketMoversKeys.all, "gainers"] as const,
  losers: () => [...marketMoversKeys.all, "losers"] as const,
  data: (type: "gainers" | "losers") =>
    [...marketMoversKeys.all, type] as const,
  symbols: (type: "gainers" | "losers") =>
    [...marketMoversKeys.all, "symbols", type] as const,
  search: (type: "gainers" | "losers", name: string) =>
    [...marketMoversKeys.all, "search", type, name] as const,
};

export const useMarketMoversGainers = (enabled = true) => {
  return useQuery<TradingViewStock[], Error>({
    queryKey: marketMoversKeys.gainers(),
    queryFn: async () => {
      const response = await baseApi.get<
        TradingViewStock[] | { data: TradingViewStock[] }
      >("/tradingview/pre-market/db?type=gainers");

      if (Array.isArray(response)) {
        return response;
      }

      if (response && typeof response === "object" && "data" in response) {
        return (response as { data: TradingViewStock[] }).data;
      }

      return [];
    },
    enabled,
    staleTime: 2 * 60 * 1000,
    refetchInterval: enabled ? 5 * 60 * 1000 : false,
  });
};

export const useMarketMoversLosers = (enabled = true) => {
  return useQuery<TradingViewStock[], Error>({
    queryKey: marketMoversKeys.losers(),
    queryFn: async () => {
      const response = await baseApi.get<
        TradingViewStock[] | { data: TradingViewStock[] }
      >("/tradingview/pre-market/db?type=losers");

      if (Array.isArray(response)) {
        return response;
      }

      if (response && typeof response === "object" && "data" in response) {
        return (response as { data: TradingViewStock[] }).data;
      }

      return [];
    },
    enabled,
    staleTime: 2 * 60 * 1000,
    refetchInterval: enabled ? 5 * 60 * 1000 : false,
  });
};

export const useMarketMovers = (enabled = true) => {
  const gainers = useMarketMoversGainers(enabled);
  const losers = useMarketMoversLosers(enabled);

  return {
    gainers: gainers.data || [],
    losers: losers.data || [],
    isLoading: gainers.isLoading || losers.isLoading,
    isFetching: gainers.isFetching || losers.isFetching,
    isError: gainers.isError || losers.isError,
    error: gainers.error || losers.error,
    refetch: async () => {
      await Promise.all([gainers.refetch(), losers.refetch()]);
    },
  };
};

export const useRefreshMarketMovers = () => {
  const queryClient = useQueryClient();

  const refreshAll = async () => {
    await queryClient.invalidateQueries({
      queryKey: marketMoversKeys.all,
    });
  };

  const refreshGainers = async () => {
    await queryClient.invalidateQueries({
      queryKey: marketMoversKeys.gainers(),
    });
  };

  const refreshLosers = async () => {
    await queryClient.invalidateQueries({
      queryKey: marketMoversKeys.losers(),
    });
  };

  return {
    refreshAll,
    refreshGainers,
    refreshLosers,
  };
};

export const useMarketMoversSymbols = (
  type: "gainers" | "losers",
  enabled = true
) => {
  return useQuery<string[], Error>({
    queryKey: marketMoversKeys.symbols(type),
    queryFn: async () => {
      const response = await baseApi.get<string[]>(
        `/tradingview/pre-market/symbols?type=${type}`
      );
      return Array.isArray(response) ? response : [];
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });
};

export const useMarketMoversSearch = (
  type: "gainers" | "losers",
  name: string,
  enabled = false
) => {
  return useQuery<TradingViewStock[], Error>({
    queryKey: marketMoversKeys.search(type, name),
    queryFn: async () => {
      if (!name || name.trim().length === 0) {
        return [];
      }
      const response = await baseApi.get<TradingViewStock[]>(
        `/tradingview/pre-market/search?type=${type}&name=${encodeURIComponent(
          name.trim()
        )}`
      );
      if (Array.isArray(response)) {
        return response;
      }
      if (response && typeof response === "object" && "data" in response) {
        return (response as { data: TradingViewStock[] }).data;
      }
      return [];
    },
    enabled: enabled && name.trim().length > 0,
    staleTime: 1 * 60 * 1000,
  });
};
