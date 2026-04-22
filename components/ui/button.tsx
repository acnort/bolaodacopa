import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-colors duration-200 disabled:pointer-events-none disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--surface-base)]",
  {
    variants: {
      variant: {
        primary:
          "bg-[color:var(--accent-strong)] text-white shadow-[var(--shadow-card)] hover:bg-[color:var(--accent-strong-hover)] focus-visible:ring-[color:var(--accent-strong)]",
        secondary:
          "bg-[color:var(--surface-muted)] text-[color:var(--text-strong)] hover:bg-[color:var(--surface-subtle)] focus-visible:ring-[color:var(--accent-soft)]",
        outline:
          "border border-[color:var(--border-strong)] bg-transparent text-[color:var(--text-strong)] hover:bg-[color:var(--surface-muted)] focus-visible:ring-[color:var(--accent-soft)]",
        ghost:
          "bg-transparent text-[color:var(--text-strong)] hover:bg-[color:var(--surface-muted)] focus-visible:ring-[color:var(--accent-soft)]",
        danger:
          "bg-[color:var(--danger)] text-white hover:bg-[color:var(--danger-strong)] focus-visible:ring-[color:var(--danger)]",
      },
      size: {
        sm: "h-9 px-4",
        md: "h-11 px-5",
        lg: "h-12 px-6",
        icon: "h-10 w-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
