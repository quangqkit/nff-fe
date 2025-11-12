"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { BreadcrumbItem } from "@/types";
import { BREADCRUMB_MAP } from "@/constants/navigation";

export function Breadcrumb() {
  const pathname = usePathname();

  const generateBreadcrumbItems = (): BreadcrumbItem[] => {
    const pathSegments = (pathname || "").split("/").filter(Boolean);
    const items: BreadcrumbItem[] = [];

    items.push({
      name: "Home",
      href: "/",
    });

    let currentPath = "";
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;

      items.push({
        name:
          BREADCRUMB_MAP[segment] ||
          segment.charAt(0).toUpperCase() + segment.slice(1),
        href: currentPath,
        current: isLast,
      });
    });

    return items;
  };

  const breadcrumbItems = generateBreadcrumbItems();

  if (breadcrumbItems.length <= 1) {
    return null;
  }

  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {breadcrumbItems.map((item, index) => (
          <li key={item.href} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="h-4 w-4 text-muted-foreground mx-2" />
            )}

            {index === 0 ? (
              <Link
                href={item.href}
                className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <Home className="h-4 w-4" />
                <span className="sr-only">Home</span>
              </Link>
            ) : item.current ? (
              <span className="text-foreground font-medium">{item.name}</span>
            ) : (
              <Link
                href={item.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
