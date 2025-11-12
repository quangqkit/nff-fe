"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export type TabId = string;

export interface Tab {
  id: TabId;
  label: string;
  content: React.ReactNode;
}

export interface CustomTabsProps {
  tabs: Tab[];
  defaultTab?: TabId;
  onTabChange?: (tabId: TabId) => void;
  className?: string;
}

export function CustomTabs({
  tabs,
  defaultTab,
  onTabChange,
  className,
}: CustomTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>(
    defaultTab || tabs[0]?.id || ""
  );

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    onTabChange?.(value);
  };

  return (
    <Tabs
      value={activeTab}
      onValueChange={handleTabChange}
      className={`h-full flex flex-col ${className}`}
    >
      <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground w-fit">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-[#707FDD] data-[state=active]:text-[#FFFFFF] data-[state=active]:shadow-sm cursor-pointer hover:text-foreground min-w-[140px]"
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.map((tab) => (
        <TabsContent
          key={tab.id}
          value={tab.id}
          className="flex-1 overflow-hidden"
        >
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}

export const createReportTabs = (
  generateContent: React.ReactNode,
  listContent: React.ReactNode
): Tab[] => [
  {
    id: "generate",
    label: "Generate new report",
    content: generateContent,
  },
  {
    id: "list",
    label: "List reports",
    content: listContent,
  },
];
