"use client";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { MAIN_NAVIGATION } from "@/constants/navigation";
import { useLocalStorage, useViewport } from "@/hooks/ui";
import { tokenManager } from "@/lib/auth/token-manager";
import { cn } from "@/lib/utils";
import { STORAGE_KEYS } from "@/utils/constants";
import { ChevronLeft, ChevronRight, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export function Sidebar() {
  const [collapsed, setCollapsed] = useLocalStorage(
    STORAGE_KEYS.SIDEBAR_COLLAPSED,
    false
  );
  const {
    isMobile,
    isTablet,
    isDesktop,
    isHydrated: viewportHydrated,
  } = useViewport();
  const pathname = usePathname();
  const router = useRouter();

  const displayCollapsed = collapsed;

  const handleLogout = () => {
    tokenManager.clearTokens();
    router.push("/login");
  };

  useEffect(() => {
    if (!viewportHydrated) return;

    if (isTablet && !collapsed) {
      setCollapsed(true);
    }

    if (isMobile && !collapsed) {
      setCollapsed(true);
    }
  }, [
    isMobile,
    isTablet,
    isDesktop,
    viewportHydrated,
    collapsed,
    setCollapsed,
  ]);

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border ">
      {!isMobile && (
        <div className="flex items-center justify-between px-4 py-4 border-b border-sidebar-border h-[77px]">
          {!displayCollapsed ? (
            <>
              <div className="flex items-center space-x-3">
                <Logo size="md" showText={false} />
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-foreground">NFF</span>
                  <span className="text-xs text-muted-foreground">
                    Auto Report
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCollapsed(!collapsed)}
                className="h-8 w-8 hover:bg-sidebar-accent text-sidebar-foreground"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <div className="flex items-center justify-center w-full">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCollapsed(false)}
                className="w-10 h-10 hover:bg-sidebar-accent text-sidebar-foreground"
              >
                <ChevronRight className="h-4 w-4 flex-shrink-0" />
              </Button>
            </div>
          )}
        </div>
      )}

      <nav className="flex-1 py-4">
        <div className="mb-6">
          {!displayCollapsed && (
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-4">
              Dashboard
            </h3>
          )}
          <ul className="space-y-1">
            {MAIN_NAVIGATION.filter((item) =>
              [
                "Dashboard",
                "Reports",
                "Ingestion",
                "Monitoring",
                "Jobs/Queue",
              ].includes(item.name)
            ).map((item) => {
              const isActive = pathname?.includes(item.href || "");
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      "group flex items-center rounded-lg transition-all duration-200 mx-2",
                      displayCollapsed
                        ? "px-3 py-3 justify-center"
                        : "px-3 py-3",
                      isActive
                        ? "bg-[#707FDD] dark:bg-[#707FDD] text-white shadow-sm"
                        : "text-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "flex-shrink-0 h-5 w-5",
                        isActive
                          ? "text-white"
                          : "text-muted-foreground group-hover:text-foreground"
                      )}
                    />
                    {!displayCollapsed && (
                      <span className="ml-3 truncate text-sm font-medium">
                        {item.name}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          {!displayCollapsed && (
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-4">
              System
            </h3>
          )}
          <ul className="space-y-1">
            {MAIN_NAVIGATION.filter((item) => item.name === "Settings").map(
              (item) => {
                const isActive = pathname?.includes(item.href || "");
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        "group flex items-center rounded-lg transition-all duration-200 mx-2",
                        displayCollapsed
                          ? "px-3 py-3 justify-center"
                          : "px-3 py-3",
                        isActive
                          ? "bg-[#707FDD] dark:bg-[#707FDD] text-white shadow-sm"
                          : "text-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "flex-shrink-0 h-5 w-5",
                          isActive
                            ? "text-white"
                            : "text-muted-foreground group-hover:text-foreground"
                        )}
                      />
                      {!displayCollapsed && (
                        <span className="ml-3 truncate text-sm font-medium">
                          {item.name}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              }
            )}
          </ul>
        </div>
      </nav>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed top-4 left-4 z-40 lg:hidden bg-background shadow-lg border border-border"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[250px] p-0 bg-background">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center space-x-3">
                <Logo size="md" showText={false} />
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-foreground">NFF</span>
                  <span className="text-xs text-muted-foreground">
                    Auto Report
                  </span>
                </div>
              </div>
            </div>
            <SidebarContent />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <>
      <div
        className={cn(
          "h-full transition-all duration-300 ease-in-out",
          displayCollapsed ? "w-20" : "w-[250px]"
        )}
        suppressHydrationWarning
      >
        <SidebarContent />
      </div>
    </>
  );
}
