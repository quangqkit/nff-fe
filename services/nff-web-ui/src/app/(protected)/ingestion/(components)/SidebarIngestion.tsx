"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TabId =
  | "configuration"
  | "raw-tweets"
  | "enrichments"
  | "market-movers"
  | "reports"
  | "polymerization";

interface SidebarIngestionProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs = [
  { id: "configuration" as const, label: "Configuration" },
  { id: "raw-tweets" as const, label: "Raw Tweets" },
  { id: "enrichments" as const, label: "Enrichments" },
  { id: "market-movers" as const, label: "Market Movers" },
  { id: "reports" as const, label: "Reports" },
  { id: "polymerization" as const, label: "Polymerization" },
];

export function SidebarIngestion({
  activeTab,
  onTabChange,
}: SidebarIngestionProps) {
  return (
    <div className="w-64 h-full border-r border-border bg-card flex flex-col">
      <nav className="flex-1 p-4 space-y-1 mt-6">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            variant={activeTab === tab.id ? "default" : "ghost"}
            className={cn(
              "w-full justify-start text-sm font-medium",
              activeTab === tab.id
                ? "bg-[#707FDD] text-white shadow-sm hover:bg-[#5A6BC7]"
                : ""
            )}
          >
            {tab.label}
          </Button>
        ))}
      </nav>
    </div>
  );
}
