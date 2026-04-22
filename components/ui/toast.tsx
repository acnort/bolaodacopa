"use client";

import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      richColors
      position="top-right"
      toastOptions={{
        classNames: {
          toast: "!rounded-lg !border !border-[color:var(--border-subtle)] !bg-[color:var(--surface-base)] !text-[color:var(--text-strong)]",
        },
      }}
    />
  );
}
