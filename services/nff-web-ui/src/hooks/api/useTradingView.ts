import { baseApi } from "@/lib/api/base";
import {
  TradingViewGainersResponse,
  TradingViewLosersResponse,
  TradingViewStock,
} from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const tradingViewKeys = {
  all: ["tradingview"] as const,
  gainers: () => [...tradingViewKeys.all, "gainers"] as const,
  losers: () => [...tradingViewKeys.all, "losers"] as const,
  data: (type: "gainers" | "losers") => [...tradingViewKeys.all, type] as const,
};

export const useTradingViewGainers = (enabled = false) => {
  return useQuery<TradingViewGainersResponse, Error>({
    queryKey: tradingViewKeys.gainers(),
    queryFn: () =>
      baseApi.get<TradingViewGainersResponse>(
        "/tradingview/pre-market?type=gainers"
      ),
    enabled,
    staleTime: 2 * 60 * 1000,
    refetchInterval: enabled ? 5 * 60 * 1000 : false,
  });
};

export const useTradingViewLosers = (enabled = false) => {
  return useQuery<TradingViewLosersResponse, Error>({
    queryKey: tradingViewKeys.losers(),
    queryFn: () =>
      baseApi.get<TradingViewLosersResponse>(
        "/tradingview/pre-market?type=losers"
      ),
    enabled,
    staleTime: 2 * 60 * 1000,
    refetchInterval: enabled ? 5 * 60 * 1000 : false,
  });
};

export const useTradingViewData = (
  type: "gainers" | "losers",
  enabled = false
) => {
  return useQuery<TradingViewStock[], Error>({
    queryKey: tradingViewKeys.data(type),
    queryFn: async () => {
      const response = await baseApi.get<TradingViewStock[]>(
        `/tradingview/pre-market?type=${type}`
      );

      if (Array.isArray(response)) {
        return response;
      }

      if (response && typeof response === "object" && "data" in response) {
        return (response as { data: TradingViewStock[] }).data;
      }

      return response;
    },
    enabled,
    staleTime: 2 * 60 * 1000,
    refetchInterval: enabled ? 5 * 60 * 1000 : false,
  });
};

export const useRefreshTradingViewData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (type: "gainers" | "losers") => {
      const response = await baseApi.get<TradingViewStock[]>(
        `/tradingview/pre-market?type=${type}`
      );

      if (Array.isArray(response)) {
        return response;
      }

      if (response && typeof response === "object" && "data" in response) {
        return (response as { data: TradingViewStock[] }).data;
      }

      return response;
    },
    onSuccess: (data, type) => {
      queryClient.setQueryData(tradingViewKeys.data(type), data);
      queryClient.invalidateQueries({ queryKey: tradingViewKeys.all });
    },
  });
};

export const useTradingViewAll = (enabled = false) => {
  const gainers = useTradingViewGainers(enabled);
  const losers = useTradingViewLosers(enabled);

  return {
    gainers,
    losers,
    isLoading: gainers.isLoading || losers.isLoading,
    isError: gainers.isError || losers.isError,
    error: gainers.error || losers.error,
  };
};

export const useTradingViewIngestion = () => {
  const queryClient = useQueryClient();

  const startGainers = async () => {
    queryClient.setQueryData(tradingViewKeys.gainers(), undefined);
    await queryClient.refetchQueries({
      queryKey: tradingViewKeys.gainers(),
    });
  };

  const startLosers = async () => {
    queryClient.setQueryData(tradingViewKeys.losers(), undefined);
    await queryClient.refetchQueries({
      queryKey: tradingViewKeys.losers(),
    });
  };

  const stopGainers = () => {
    queryClient.setQueryData(tradingViewKeys.gainers(), undefined);
  };

  const stopLosers = () => {
    queryClient.setQueryData(tradingViewKeys.losers(), undefined);
  };

  const refreshGainers = async () => {
    await queryClient.invalidateQueries({
      queryKey: tradingViewKeys.gainers(),
    });
  };

  const refreshLosers = async () => {
    await queryClient.invalidateQueries({ queryKey: tradingViewKeys.losers() });
  };

  const refreshAll = async () => {
    await queryClient.invalidateQueries({ queryKey: tradingViewKeys.all });
  };

  return {
    startGainers,
    startLosers,
    stopGainers,
    stopLosers,
    refreshGainers,
    refreshLosers,
    refreshAll,
  };
};
