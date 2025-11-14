"use client";

import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  useLobstrWindowSchedules,
  useTradingViewData,
  useTradingViewIngestion,
  useUpdateLobstrWindowScheduleStatus,
} from "@/hooks/api";
import { TradingViewStock } from "@/types";
import { Play, RefreshCw, Square } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const LOBSTR_GROUP_TITLE = "Twitter/X Ingestion via Lobstr API";
const TRADING_VIEW_GROUP_TITLE = "Scrape Pre-Market/Movers from TradingView";
const TRADING_VIEW_SERVICE_IDS = [
  "tradingview-gainers",
  "tradingview-losers",
] as const;

type TradingViewServiceId = (typeof TRADING_VIEW_SERVICE_IDS)[number];

interface Service {
  id: string;
  primaryText: string;
  secondaryText: string;
  isRunning: boolean;
  data?: TradingViewStock[];
  lastFetched?: string;
  error?: string | Error;
}

interface ServiceGroup {
  title: string;
  services: Service[];
}

type PendingStop = {
  serviceId: TradingViewServiceId;
  title: string;
};

type LobstrRunningMap = Record<string, boolean>;
type TradingViewErrorMap = Record<string, string>;
type TradingViewActionHandler = () => void | Promise<void>;
interface TradingViewActionHandlers {
  start: TradingViewActionHandler;
  stop: TradingViewActionHandler;
  refresh: TradingViewActionHandler;
}

interface BaseServiceInfo {
  id: TradingViewServiceId;
  primaryText: string;
  secondaryText: string;
}

const TRADING_VIEW_SERVICE_INFO: BaseServiceInfo[] = [
  {
    id: "tradingview-gainers",
    primaryText: "Service: Pre Market Gainers",
    secondaryText: "TradingView scraper writes daily",
  },
  {
    id: "tradingview-losers",
    primaryText: "Service: Pre Market Losers",
    secondaryText: "TradingView scraper writes daily",
  },
];

const isLobstrService = (serviceId: string) => serviceId.startsWith("lobstr-");
const isTradingViewService = (
  serviceId: string
): serviceId is TradingViewServiceId =>
  TRADING_VIEW_SERVICE_IDS.includes(serviceId as TradingViewServiceId);

const getLobstrScheduleId = (serviceId: string) => {
  const numericId = Number(serviceId.replace("lobstr-", ""));
  return Number.isNaN(numericId) ? undefined : numericId;
};

const normalizeError = (error: unknown): string | Error | undefined => {
  if (!error) {
    return undefined;
  }

  if (error instanceof Error) {
    return error;
  }

  if (typeof error === "string") {
    return error;
  }

  return undefined;
};

interface LobstrServiceItemProps {
  service: Service;
  onToggle: (serviceId: string) => void | Promise<void>;
  isUpdating: boolean;
}

const LobstrServiceItem = ({
  service,
  onToggle,
  isUpdating,
}: LobstrServiceItemProps) => {
  const errorMessage =
    typeof service.error === "string" ? service.error : service.error?.message;

  return (
    <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-white dark:bg-card">
      <div>
        <p className="text-sm font-semibold text-foreground">
          {service.primaryText}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {service.secondaryText}
        </p>
        {errorMessage && (
          <p className="text-xs text-red-600 font-medium mt-2">
            Error: {errorMessage}
          </p>
        )}
      </div>
      <Button
        onClick={() => {
          void onToggle(service.id);
        }}
        variant={service.isRunning ? "default" : "outline"}
        className="font-semibold px-6"
        size="sm"
        disabled={isUpdating}
      >
        {isUpdating ? "Saving..." : service.isRunning ? "On" : "Off"}
      </Button>
    </div>
  );
};

interface TradingViewServiceItemProps {
  service: Service;
  onRunClick: (service: Service) => void;
  onRefreshClick: () => void;
  isRefreshing: boolean;
}

const TradingViewServiceItem = ({
  service,
  onRunClick,
  onRefreshClick,
  isRefreshing,
}: TradingViewServiceItemProps) => {
  const errorMessage =
    typeof service.error === "string" ? service.error : service.error?.message;

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
          {service.data && service.data.length > 0 && (
            <div className="flex items-center gap-2.5 text-xs">
              <div className="w-2 h-2 rounded-full bg-blue-600 shadow-sm" />
              <span className="text-foreground font-medium">
                {service.data.length} stocks loaded
              </span>
            </div>
          )}
          {errorMessage && (
            <div className="flex items-center gap-2.5 text-xs">
              <div className="w-2 h-2 rounded-full bg-red-600 shadow-sm" />
              <span className="text-red-600 font-medium">
                Error: {errorMessage}
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
          {service.isRunning && !service.data && !errorMessage && (
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
          onClick={() => onRunClick(service)}
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
            onClick={onRefreshClick}
            variant="outline"
            size="sm"
            disabled={isRefreshing}
            className="shadow-md border-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </Button>
        )}
      </div>
    </div>
  );
};

export function Configuration() {
  const [runningServices, setRunningServices] = useState<Set<string>>(
    new Set()
  );
  const [refreshingServices, setRefreshingServices] = useState<Set<string>>(
    new Set()
  );
  const [lobstrRunning, setLobstrRunning] = useState<LobstrRunningMap>({});
  const [updatingLobstrServices, setUpdatingLobstrServices] = useState<
    Set<string>
  >(new Set());
  const [lobstrErrors, setLobstrErrors] = useState<Record<string, string>>({});
  const [tradingViewErrors, setTradingViewErrors] =
    useState<TradingViewErrorMap>({});
  const [pendingStop, setPendingStop] = useState<PendingStop | null>(null);
  const { mutateAsync: updateLobstrWindowScheduleStatus } =
    useUpdateLobstrWindowScheduleStatus();

  const {
    startGainers,
    startLosers,
    stopGainers,
    stopLosers,
    refreshGainers,
    refreshLosers,
  } = useTradingViewIngestion();

  const {
    data: lobstrSchedules,
    isLoading: lobstrLoading,
    error: lobstrError,
  } = useLobstrWindowSchedules();

  const gainersRunning = runningServices.has("tradingview-gainers");
  const losersRunning = runningServices.has("tradingview-losers");

  const { data: gainersData, error: gainersError } = useTradingViewData(
    "gainers",
    gainersRunning
  );
  const { data: losersData, error: losersError } = useTradingViewData(
    "losers",
    losersRunning
  );

  useEffect(() => {
    if (!lobstrSchedules) {
      return;
    }

    setLobstrRunning((prev) => {
      const next: LobstrRunningMap = {};

      lobstrSchedules.forEach((schedule) => {
        const serviceId = `lobstr-${schedule.id}`;
        const initialState = Boolean(schedule.isActive);
        next[serviceId] = serviceId in prev ? prev[serviceId] : initialState;
      });

      return next;
    });
  }, [lobstrSchedules]);

  const tradingViewHandlers = useMemo<
    Record<TradingViewServiceId, TradingViewActionHandlers>
  >(
    () => ({
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
    }),
    [
      startGainers,
      startLosers,
      stopGainers,
      stopLosers,
      refreshGainers,
      refreshLosers,
    ]
  );

  const lobstrServices = useMemo<Service[]>(() => {
    if (!lobstrSchedules) {
      return [];
    }

    const sortedSchedules = [...lobstrSchedules].sort((a, b) =>
      a.windowTime.localeCompare(b.windowTime)
    );

    return sortedSchedules.map((schedule) => {
      const serviceId = `lobstr-${schedule.id}`;
      const lookbackHours = schedule.lookbackHours ?? 0;
      const lookbackText =
        lookbackHours === 1
          ? "Look back 1 hour"
          : `Look back ${lookbackHours} hours`;
      const timeZoneLabel =
        schedule.timeZone === "Asia/Jerusalem" ? "IL" : schedule.timeZone;

      return {
        id: serviceId,
        primaryText: `Service: ${schedule.windowTime} (Window time) ${timeZoneLabel}`,
        secondaryText: lookbackText,
        isRunning: lobstrRunning[serviceId] ?? Boolean(schedule.isActive),
        error: lobstrErrors[serviceId],
      };
    });
  }, [lobstrSchedules, lobstrRunning, lobstrErrors]);

  const tradingViewServices = useMemo<Service[]>(() => {
    return TRADING_VIEW_SERVICE_INFO.map((definition) => {
      const hookData =
        definition.id === "tradingview-gainers" ? gainersData : losersData;
      const hookError = normalizeError(
        definition.id === "tradingview-gainers" ? gainersError : losersError
      );
      const manualError = tradingViewErrors[definition.id];

      return {
        ...definition,
        isRunning: runningServices.has(definition.id),
        data: hookData,
        error: manualError ?? hookError,
      };
    });
  }, [
    gainersData,
    losersData,
    gainersError,
    losersError,
    runningServices,
    tradingViewErrors,
  ]);

  const serviceGroups = useMemo<ServiceGroup[]>(
    () => [
      {
        title: LOBSTR_GROUP_TITLE,
        services: lobstrServices,
      },
      {
        title: TRADING_VIEW_GROUP_TITLE,
        services: tradingViewServices,
      },
    ],
    [lobstrServices, tradingViewServices]
  );

  const lobstrErrorMessage = normalizeError(lobstrError);

  const clearTradingViewError = (serviceId: string) => {
    setTradingViewErrors((prev) => {
      const updated = { ...prev };
      delete updated[serviceId];
      return updated;
    });
  };

  const handleLobstrToggle = async (serviceId: string) => {
    const scheduleId = getLobstrScheduleId(serviceId);
    if (scheduleId === undefined) {
      return;
    }

    const nextState = !(lobstrRunning[serviceId] ?? false);

    setLobstrRunning((prev) => ({
      ...prev,
      [serviceId]: nextState,
    }));

    setUpdatingLobstrServices((prev) => {
      const next = new Set(prev);
      next.add(serviceId);
      return next;
    });

    setLobstrErrors((prev) => {
      const updated = { ...prev };
      delete updated[serviceId];
      return updated;
    });

    try {
      await updateLobstrWindowScheduleStatus({
        id: scheduleId,
        isActive: nextState,
      });
    } catch (error) {
      setLobstrRunning((prev) => ({
        ...prev,
        [serviceId]: !nextState,
      }));
      setLobstrErrors((prev) => ({
        ...prev,
        [serviceId]:
          error instanceof Error
            ? error.message
            : "Failed to update schedule status",
      }));
    } finally {
      setUpdatingLobstrServices((prev) => {
        const next = new Set(prev);
        next.delete(serviceId);
        return next;
      });
    }
  };

  const startTradingViewService = async (serviceId: TradingViewServiceId) => {
    const handler = tradingViewHandlers[serviceId]?.start;
    if (!handler) {
      return;
    }

    setRunningServices((prev) => {
      const next = new Set(prev);
      next.add(serviceId);
      return next;
    });
    clearTradingViewError(serviceId);

    try {
      await handler();
    } catch (error) {
      setTradingViewErrors((prev) => ({
        ...prev,
        [serviceId]: error instanceof Error ? error.message : "Unknown error",
      }));
      setRunningServices((prev) => {
        const next = new Set(prev);
        next.delete(serviceId);
        return next;
      });
    }
  };

  const stopTradingViewService = async (serviceId: TradingViewServiceId) => {
    const handler = tradingViewHandlers[serviceId]?.stop;
    if (!handler) {
      return;
    }

    setRunningServices((prev) => {
      const next = new Set(prev);
      next.delete(serviceId);
      return next;
    });

    try {
      await handler();
    } catch (error) {
      setTradingViewErrors((prev) => ({
        ...prev,
        [serviceId]: error instanceof Error ? error.message : "Unknown error",
      }));
    }
  };

  const refreshTradingViewService = async (serviceId: TradingViewServiceId) => {
    const handler = tradingViewHandlers[serviceId]?.refresh;
    if (!handler) {
      return;
    }

    setRefreshingServices((prev) => {
      const next = new Set(prev);
      next.add(serviceId);
      return next;
    });

    try {
      await handler();
      clearTradingViewError(serviceId);
    } catch (error) {
      setTradingViewErrors((prev) => ({
        ...prev,
        [serviceId]: error instanceof Error ? error.message : "Unknown error",
      }));
    } finally {
      setRefreshingServices((prev) => {
        const next = new Set(prev);
        next.delete(serviceId);
        return next;
      });
    }
  };

  const handleRunClick = (service: Service) => {
    if (isLobstrService(service.id)) {
      void handleLobstrToggle(service.id);
      return;
    }

    if (!isTradingViewService(service.id)) {
      return;
    }

    if (service.isRunning) {
      setPendingStop({
        serviceId: service.id,
        title: service.primaryText,
      });
      return;
    }

    void startTradingViewService(service.id);
  };

  const handleStopConfirm = () => {
    if (!pendingStop) {
      return;
    }

    void stopTradingViewService(pendingStop.serviceId);
    setPendingStop(null);
  };

  const handleStopCancel = () => {
    setPendingStop(null);
  };

  const isServiceRefreshing = (serviceId: string) =>
    refreshingServices.has(serviceId);

  return (
    <>
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground text-left">
          Data Ingestion Service Console
        </h1>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {serviceGroups.map((group) => (
          <Card
            key={group.title}
            className="border-2 border-border bg-white dark:bg-card shadow-md"
          >
            <CardContent className="p-6">
              <h2 className="text-lg font-bold text-foreground mb-5 pb-3 border-b-2 border-[#707FDD]/30">
                {group.title}
              </h2>
              <div className="space-y-3">
                {group.title === LOBSTR_GROUP_TITLE &&
                  lobstrLoading &&
                  group.services.length === 0 && (
                    <div className="text-sm text-muted-foreground font-medium">
                      Loading schedules...
                    </div>
                  )}
                {group.title === LOBSTR_GROUP_TITLE && lobstrErrorMessage && (
                  <div className="text-sm text-red-600 font-medium">
                    {typeof lobstrErrorMessage === "string"
                      ? lobstrErrorMessage
                      : lobstrErrorMessage?.message ?? "Unknown error"}
                  </div>
                )}
                {group.title === LOBSTR_GROUP_TITLE &&
                  !lobstrLoading &&
                  !lobstrError &&
                  group.services.length === 0 && (
                    <div className="text-sm text-muted-foreground font-medium">
                      No schedules found.
                    </div>
                  )}
                {group.title === LOBSTR_GROUP_TITLE &&
                  group.services.map((service) => (
                    <LobstrServiceItem
                      key={service.id}
                      service={service}
                      onToggle={handleLobstrToggle}
                      isUpdating={updatingLobstrServices.has(service.id)}
                    />
                  ))}
                {group.title === TRADING_VIEW_GROUP_TITLE &&
                  group.services.map((service) => (
                    <TradingViewServiceItem
                      key={service.id}
                      service={service}
                      onRunClick={handleRunClick}
                      onRefreshClick={() => {
                        if (isTradingViewService(service.id)) {
                          void refreshTradingViewService(service.id);
                        }
                      }}
                      isRefreshing={isServiceRefreshing(service.id)}
                    />
                  ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ConfirmDialog
        isOpen={Boolean(pendingStop)}
        onClose={handleStopCancel}
        onConfirm={handleStopConfirm}
        title={pendingStop?.title ?? ""}
        description="Are you sure you want to cancel this job?"
        confirmText="Confirm"
        cancelText="Cancel"
        variant="destructive"
      />
    </>
  );
}
