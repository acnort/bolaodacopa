import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.18em]",
  {
    variants: {
      variant: {
        neutral: "bg-[color:var(--surface-muted)] text-[color:var(--text-strong)]",
        success: "bg-transparent text-[color:var(--success-strong)]",
        warning: "bg-[color:var(--warning-soft)] text-[color:var(--warning-strong)]",
        danger: "bg-transparent text-[color:var(--danger-strong)]",
        accent: "bg-[color:var(--accent-muted)] text-[color:var(--accent-strong)]",
      },
      size: {
        large: "px-3 text-xs",
        medium: "px-2.5 text-[11px]",
        small: "px-2 text-[10px]",
      },
    },
    defaultVariants: {
      variant: "neutral",
      size: "medium",
    },
  },
);

export interface BadgeProps
  extends React.ComponentProps<"span">,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size, className }))} {...props} />;
}
