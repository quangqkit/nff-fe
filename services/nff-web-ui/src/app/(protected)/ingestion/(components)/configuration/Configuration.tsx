"use client";

import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTradingViewData, useTradingViewIngestion } from "@/hooks/api";
import { TradingViewStock } from "@/types";
import { Play, RefreshCw, Square } from "lucide-react";
import { useState } from "react";

interface Service {
  id: string;
  primaryText: string;
  secondaryText: string;
  isRunning: boolean;
  data?: TradingViewStock[];
  lastFetched?: string;
  error?: string;
}

interface ServiceGroup {
  title: string;
  services: Service[];
}

export function Configuration() {
  const [runningServices, setRunningServices] = useState<Set<string>>(
    new Set()
  );
  const [refreshingServices, setRefreshingServices] = useState<Set<string>>(
    new Set()
  );

  const {
    startGainers,
    startLosers,
    stopGainers,
    stopLosers,
    refreshGainers,
    refreshLosers,
  } = useTradingViewIngestion();

  const { data: gainersData, error: gainersError } = useTradingViewData(
    "gainers",
    runningServices.has("tradingview-gainers")
  );
  const { data: losersData, error: losersError } = useTradingViewData(
    "losers",
    runningServices.has("tradingview-losers")
  );

  const [pendingStop, setPendingStop] = useState<
    | {
        groupId: number;
        serviceId: string;
        title: string;
      }
    | undefined
  >(undefined);

  const [services, setServices] = useState<ServiceGroup[]>([
    {
      title: "Twitter/X Ingestion via Lobstr API",
      services: [
        {
          id: "twitter-1",
          primaryText: "Service: 03:00 (Window time) IL",
          secondaryText: "Look back 4 hours",
          isRunning: false,
        },
        {
          id: "twitter-2",
          primaryText: "Service 2: Schedule at 11:00 IL",
          secondaryText: "Look back 8 hours",
          isRunning: false,
        },
        {
          id: "twitter-3",
          primaryText: "Service 3: Schedule at 14:00 IL",
          secondaryText: "Look back 3 hours",
          isRunning: false,
        },
        {
          id: "twitter-4",
          primaryText: "Service 4: Schedule at 15:33 IL",
          secondaryText: "Look back 1 hours 33 minutes",
          isRunning: false,
        },
      ],
    },
    {
      title: "Scrape Pre-Market/Movers from TradingView",
      services: [
        {
          id: "tradingview-gainers",
          primaryText: "Service: Pre Market Gainers",
          secondaryText: "TradingView scraper writes daily",
          isRunning: false,
        },
        {
          id: "tradingview-losers",
          primaryText: "Service: Pre Market Losers",
          secondaryText: "TradingView scraper writes daily",
          isRunning: false,
        },
      ],
    },
  ]);

  // Helper functions
  const updateServiceState = (
    groupId: number,
    serviceId: string,
    updates: Partial<Service>
  ) => {
    setServices((prev) =>
      prev.map((group, gIdx) =>
        gIdx === groupId
          ? {
              ...group,
              services: group.services.map((s) =>
                s.id === serviceId ? { ...s, ...updates } : s
              ),
            }
          : group
      )
    );
  };

  const handleTradingViewAction = async (
    serviceId: string,
    action: "start" | "stop" | "refresh"
  ) => {
    const actions = {
      "tradingview-gainers": {
        start: startGainers,
        stop: stopGainers,
        refresh: refreshGainers,
      },
      "tradingview-losers": {
        start: startLosers,
        stop: stopLosers,
        refresh: refreshLosers,
      },
    };
    return actions[serviceId as keyof typeof actions]?.[action]?.();
  };

  const toggleService = async (groupId: number, serviceId: string) => {
    const service = services[groupId].services.find((s) => s.id === serviceId);
    const newRunningState = !service?.isRunning;

    updateServiceState(groupId, serviceId, { isRunning: newRunningState });

    if (newRunningState) {
      setRunningServices((prev) => new Set(prev).add(serviceId));
      try {
        await handleTradingViewAction(serviceId, "start");
      } catch (error) {
        updateServiceState(groupId, serviceId, {
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    } else {
      setRunningServices((prev) => {
        const newSet = new Set(prev);
        newSet.delete(serviceId);
        return newSet;
      });
      handleTradingViewAction(serviceId, "stop");
    }
  };

  const handleRefresh = async (serviceId: string) => {
    setRefreshingServices((prev) => new Set(prev).add(serviceId));
    try {
      await handleTradingViewAction(serviceId, "refresh");
    } finally {
      setRefreshingServices((prev) => {
        const newSet = new Set(prev);
        newSet.delete(serviceId);
        return newSet;
      });
    }
  };

  const handleRunClick = (groupId: number, service: Service) => {
    if (service.isRunning) {
      // Ask for confirmation when stopping a running job
      setPendingStop({
        groupId,
        serviceId: service.id,
        title: service.primaryText,
      });
      return;
    }

    // Start immediately without showing dialog
    toggleService(groupId, service.id);
  };

  // Service Item Component
  const ServiceItem = ({
    service,
    groupId,
  }: {
    service: Service;
    groupId: number;
  }) => {
    const currentData =
      service.id === "tradingview-gainers"
        ? gainersData
        : service.id === "tradingview-losers"
        ? losersData
        : service.data;
    const currentError =
      service.id === "tradingview-gainers"
        ? gainersError
        : service.id === "tradingview-losers"
        ? losersError
        : service.error;

    return (
      <div className="flex items-center justify-between p-5 rounded-lg border border-border bg-white dark:bg-card hover:shadow-md hover:border-[#707FDD] transition-all duration-200">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div
              className={`w-3 h-3 rounded-full shadow-sm ${
                service.isRunning
                  ? "bg-emerald-600 animate-pulse ring-2 ring-emerald-400/50"
                  : "bg-slate-400"
              }`}
            />
            <p className="text-sm font-semibold text-foreground">
              {service.primaryText}
            </p>
          </div>
          <p className="text-xs text-muted-foreground font-mono ml-6 mb-3">
            {service.secondaryText}
          </p>

          <div className="ml-6 space-y-1.5">
            {currentData && currentData.length > 0 && (
              <div className="flex items-center gap-2.5 text-xs">
                <div className="w-2 h-2 rounded-full bg-blue-600 shadow-sm" />
                <span className="text-foreground font-medium">
                  {currentData.length} stocks loaded
                </span>
              </div>
            )}
            {currentError && (
              <div className="flex items-center gap-2.5 text-xs">
                <div className="w-2 h-2 rounded-full bg-red-600 shadow-sm" />
                <span className="text-red-600 font-medium">
                  Error:{" "}
                  {currentError instanceof Error
                    ? currentError.message
                    : currentError}
                </span>
              </div>
            )}
            {service.lastFetched && (
              <div className="flex items-center gap-2.5 text-xs">
                <div className="w-2 h-2 rounded-full bg-[#707FDD] shadow-sm" />
                <span className="text-foreground font-medium">
                  Last updated:{" "}
                  {new Date(service.lastFetched).toLocaleTimeString()}
                </span>
              </div>
            )}
            {service.isRunning && !currentData && !currentError && (
              <div className="flex items-center gap-2.5 text-xs">
                <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse shadow-sm" />
                <span className="text-blue-600 font-medium">
                  Fetching data...
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => handleRunClick(groupId, service)}
            variant={service.isRunning ? "destructive" : "default"}
            size="sm"
            className="shadow-md font-semibold"
          >
            {service.isRunning ? (
              <>
                <Square className="h-4 w-4 mr-1" />
                Stop
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-1" />
                Run
              </>
            )}
          </Button>

          {service.isRunning && (
            <Button
              onClick={() => handleRefresh(service.id)}
              variant="outline"
              size="sm"
              disabled={refreshingServices.has(service.id)}
              className="shadow-md border-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  refreshingServices.has(service.id) ? "animate-spin" : ""
                }`}
              />
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground">
          Data Ingestion Service Console
        </h1>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {services.map((group, groupId) => (
          <Card
            key={group.title}
            className="border-2 border-border bg-white dark:bg-card shadow-md"
          >
            <CardContent className="p-6">
              <h2 className="text-lg font-bold text-foreground mb-5 pb-3 border-b-2 border-[#707FDD]/30">
                {group.title}
              </h2>
              <div className="space-y-3">
                {group.services.map((service) => (
                  <ServiceItem
                    key={service.id}
                    service={service}
                    groupId={groupId}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ConfirmDialog
        isOpen={!!pendingStop}
        onClose={() => setPendingStop(undefined)}
        onConfirm={() => {
          if (pendingStop) {
            toggleService(pendingStop.groupId, pendingStop.serviceId);
            setPendingStop(undefined);
          }
        }}
        title=""
        description="Are you sure you want to cancel this job?"
        confirmText="Confirm"
        cancelText="Cancel"
        variant="destructive"
      />
    </>
  );
}
