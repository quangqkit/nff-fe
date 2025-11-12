"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Eye, EyeOff } from "lucide-react";

interface ToggleButtonProps {
  isEnabled: boolean;
  onToggle: () => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

export function ToggleButton({
  isEnabled,
  onToggle,
  isLoading = false,
  className,
}: ToggleButtonProps) {
  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = async () => {
    if (isToggling || isLoading) return;

    setIsToggling(true);
    try {
      await onToggle();
    } catch (error) {
      console.error("Toggle failed:", error);
    } finally {
      setIsToggling(false);
    }
  };

  const buttonText = isEnabled ? "Disable" : "Enable";
  const buttonVariant = isEnabled ? "destructive" : "default";
  const Icon = isEnabled ? EyeOff : Eye;

  return (
    <Button
      variant={buttonVariant}
      size="sm"
      onClick={handleToggle}
      disabled={isToggling || isLoading}
      className={className}
    >
      {isToggling || isLoading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Icon className="h-4 w-4 mr-2" />
      )}
      {isToggling || isLoading ? "Processing..." : buttonText}
    </Button>
  );
}
