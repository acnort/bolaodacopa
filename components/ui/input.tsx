import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const inputVariants = cva(
  "flex h-11 w-full border px-4 text-sm text-[color:var(--text-strong)] outline-none transition",
  {
    variants: {
      variant: {
        default:
          "rounded-lg border-[color:var(--border-subtle)] bg-[color:var(--surface-base)] shadow-sm focus:border-[color:var(--accent-soft)] focus:ring-2 focus:ring-[color:var(--accent-soft)]/20",
        ghost:
          "rounded-md border-transparent bg-transparent px-2 shadow-none focus:border-[color:var(--border-subtle)] focus:bg-[color:var(--surface-base)] focus:ring-0",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export function Input({
  className,
  variant,
  ...props
}: React.ComponentProps<"input"> & VariantProps<typeof inputVariants>) {
  return (
    <input
      className={cn(inputVariants({ variant, className }))}
      {...props}
    />
  );
}
