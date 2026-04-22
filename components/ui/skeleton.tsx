import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-[linear-gradient(90deg,var(--surface-muted),var(--surface-subtle),var(--surface-muted))] bg-[length:200%_100%]",
        className,
      )}
    />
  );
}
