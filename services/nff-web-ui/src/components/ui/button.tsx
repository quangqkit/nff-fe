import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center cursor-pointer gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-[#707FDD] text-white shadow-xs hover:bg-[#5A6BC7] focus-visible:ring-[#707FDD]/50",
        destructive:
          "bg-[#EF4444] text-white shadow-xs hover:bg-[#DC2626] focus-visible:ring-[#EF4444]/20",
        outline:
          "border border-[#707FDD] bg-transparent text-[#707FDD] shadow-xs hover:bg-[#707FDD] hover:text-white dark:border-[#707FDD] dark:text-[#707FDD] dark:hover:bg-[#707FDD] dark:hover:text-white",
        secondary:
          "bg-gray-100 text-gray-900 shadow-xs hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700",
        ghost:
          "hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-100",
        link: "text-[#707FDD] underline-offset-4 hover:underline hover:text-[#5A6BC7]",
        success:
          "bg-[#10B981] text-white shadow-xs hover:bg-[#059669] focus-visible:ring-[#10B981]/20",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
