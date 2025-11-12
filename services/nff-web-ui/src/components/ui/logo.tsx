import { cn } from "@/lib/utils";
import Image from "next/image";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function Logo({ className, size = "md", showText = true }: LogoProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl",
  };

  return (
    <div
      className={cn(
        "flex items-center justify-center",
        sizeClasses[size],
        className
      )}
    >
      <Image
        src="/images/logo.svg"
        alt="NFF Logo"
        width={32}
        height={32}
        className="h-full w-full object-contain"
        priority
      />
      {showText && (
        <span
          className={cn(
            "ml-2 font-bold text-slate-900 dark:text-slate-100",
            textSizeClasses[size]
          )}
        >
          NFF
        </span>
      )}
    </div>
  );
}
