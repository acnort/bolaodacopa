"use client";

import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";

import { cn } from "@/lib/utils";

export const Drawer = DrawerPrimitive.Root;
export const DrawerTrigger = DrawerPrimitive.Trigger;
export const DrawerClose = DrawerPrimitive.Close;

export function DrawerPortal({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Portal>) {
  return <DrawerPrimitive.Portal {...props} />;
}

export function DrawerOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Overlay>) {
  return (
    <DrawerPrimitive.Overlay
      className={cn(
        "fixed inset-0 z-40 bg-[color:var(--overlay)] backdrop-blur-sm",
        className,
      )}
      {...props}
    />
  );
}

export function DrawerContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Content>) {
  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Content
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 max-h-[calc(100dvh-1rem)] overflow-y-auto overscroll-contain rounded-t-xl border border-b-0 border-[color:var(--border-subtle)] bg-[color:var(--surface-base)] p-5 shadow-[var(--shadow-card)]",
          className,
        )}
        {...props}
      >
        <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-[color:var(--surface-subtle)]" />
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  );
}

export function DrawerHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return <div className={cn("space-y-1 pb-4", className)} {...props} />;
}

export function DrawerTitle({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Title>) {
  return (
    <DrawerPrimitive.Title
      className={cn(
        "text-lg font-semibold text-[color:var(--text-strong)]",
        className,
      )}
      {...props}
    />
  );
}

export function DrawerDescription({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Description>) {
  return (
    <DrawerPrimitive.Description
      className={cn("text-sm text-[color:var(--text-muted)]", className)}
      {...props}
    />
  );
}
