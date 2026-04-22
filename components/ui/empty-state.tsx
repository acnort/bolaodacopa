import { CircleOff } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  className,
}: {
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <Card className={cn(className)}>
      <CardContent className="flex flex-col items-start gap-4 p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[color:var(--surface-muted)]">
          <CircleOff className="h-5 w-5 text-[color:var(--text-muted)]" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-[color:var(--text-strong)]">
            {title}
          </h3>
          <p className="text-sm text-[color:var(--text-muted)]">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
