"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ThemeToggleButtonProps {
  size?: "sm" | "md" | "lg";
  variant?: "default" | "ghost" | "outline";
}

export function ThemeToggleButton({
  size = "md",
  variant = "ghost",
}: ThemeToggleButtonProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const isDark = resolvedTheme === "dark";

  const handleToggle = () => {
    setTheme(isDark ? "light" : "dark");
  };

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-9 w-9",
    lg: "h-10 w-10",
  };

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  return (
    <Button
      variant={variant}
      size="icon"
      onClick={handleToggle}
      className={cn(
        "transition-all duration-200 hover:scale-105",
        sizeClasses[size]
      )}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className={cn(iconSizes[size], "text-yellow-500")} />
      ) : (
        <Moon className={cn(iconSizes[size], "text-muted-foreground")} />
      )}
    </Button>
  );
}
