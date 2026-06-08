"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { PhaseCountdownBadge } from "@/components/phase-countdown-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { PredictionRule } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

export type PhaseProgressItem = {
  phaseId: string;
  phaseName: string;
  href: string;
  savedCount: number;
  totalCount: number;
  status: "empty" | "partial" | "complete";
  isSelected: boolean;
  rule?: PredictionRule;
};

function getStatusCopy(status: PhaseProgressItem["status"]) {
  if (status === "complete") {
    return { label: "Completo", variant: "success" as const };
  }

  if (status === "partial") {
    return { label: "Parcial", variant: "warning" as const };
  }

  return { label: "Vazio", variant: "neutral" as const };
}

export function PhaseProgressSidebar({
  items,
  countLabel = "salvos",
}: {
  items: PhaseProgressItem[];
  countLabel?: string;
}) {
  const hasCountdown = items.some((item) => item.rule);
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    if (!hasCountdown) return;

    const interval = window.setInterval(() => setCurrentTime(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, [hasCountdown]);

  return (
    <Card className="h-fit">
      <CardHeader>
        <div className="text-lg font-bold text-[color:var(--text-strong)]">
          Fases
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => {
          const status = getStatusCopy(item.status);
          const completionRatio =
            item.totalCount > 0 ? (item.savedCount / item.totalCount) * 100 : 0;

          return (
            <Link
              key={item.phaseId}
              href={item.href}
              className={cn(
                "block rounded-lg border border-[color:var(--border-subtle)] px-4 py-4 transition",
                item.isSelected
                  ? "bg-[color:var(--surface-muted)]"
                  : "hover:bg-[color:var(--surface-muted)]",
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-semibold text-[color:var(--text-strong)]">
                    {item.phaseName}
                  </div>
                  <div className="mt-1 text-sm text-[color:var(--text-muted)]">
                    {item.savedCount}/{item.totalCount} {countLabel}
                  </div>
                  {item.rule ? (
                    <div className="mt-2">
                      <PhaseCountdownBadge
                        rule={item.rule}
                        now={currentTime}
                        compact
                      />
                    </div>
                  ) : null}
                </div>
                <Badge variant={status.variant} size="small">
                  {status.label}
                </Badge>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[color:var(--surface-subtle)]">
                <div
                  className={cn(
                    "h-full rounded-full transition-[width]",
                    item.status === "complete" &&
                      "bg-[color:var(--success-strong)]",
                    item.status === "partial" &&
                      "bg-[color:var(--warning-strong)]",
                    item.status === "empty" && "bg-[color:var(--border-subtle)]",
                  )}
                  style={{ width: `${completionRatio}%` }}
                />
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
