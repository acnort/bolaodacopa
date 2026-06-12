import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "neutral" | "accent" | "success" | "warning";
}) {
  const variant =
    tone === "accent"
      ? "accent"
      : tone === "success"
        ? "success"
        : tone === "warning"
          ? "warning"
          : "neutral";

  return (
    <Card>
      <CardContent className="space-y-4 p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-[color:var(--text-muted)]">{label}</p>
          <Badge variant={variant}>{tone}</Badge>
        </div>
        <div>
          <p className="text-3xl font-semibold text-[color:var(--text-strong)]">
            {value}
          </p>
          <div className="mt-2 flex items-center gap-2 text-sm text-[color:var(--text-muted)]">
            <ArrowRight className="h-4 w-4" />
            <span>{hint}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
