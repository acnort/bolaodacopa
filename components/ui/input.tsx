import * as React from "react";

import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "flex h-11 w-full rounded-lg border border-[color:var(--border-subtle)] bg-[color:var(--surface-base)] px-4 text-sm text-[color:var(--text-strong)] shadow-sm outline-none transition focus:border-[color:var(--accent-soft)] focus:ring-2 focus:ring-[color:var(--accent-soft)]/20",
        className,
      )}
      {...props}
    />
  );
}
