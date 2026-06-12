import { Clock3, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime } from "@/lib/formatters";
import { cn } from "@/lib/utils";

export interface PredictionCardProps {
  homeTeam: string;
  awayTeam: string;
  venue: string;
  kickoffAt: string;
  status: "aberto" | "fechado" | "apurado";
  prediction?: string;
  className?: string;
}

export function PredictionCard({
  homeTeam,
  awayTeam,
  venue,
  kickoffAt,
  status,
  prediction,
  className,
}: PredictionCardProps) {
  const statusVariant =
    status === "aberto"
      ? "success"
      : status === "apurado"
        ? "accent"
        : "warning";

  return (
    <Card className={cn(className)}>
      <CardContent className="space-y-5 p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.18em] text-[color:var(--text-muted)] uppercase">
              Partida
            </p>
            <h3 className="mt-2 text-lg font-semibold text-[color:var(--text-strong)]">
              {homeTeam} x {awayTeam}
            </h3>
          </div>
          <Badge variant={statusVariant}>{status}</Badge>
        </div>

        <div className="grid gap-3 text-sm text-[color:var(--text-muted)] sm:grid-cols-2">
          <div className="flex items-center gap-2">
            <Clock3 className="h-4 w-4" />
            <span>{formatDateTime(kickoffAt)}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>{venue}</span>
          </div>
        </div>

        <div className="flex flex-col items-start justify-between gap-4 rounded-lg bg-[color:var(--surface-muted)] p-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs tracking-[0.18em] text-[color:var(--text-muted)] uppercase">
              Seu palpite
            </p>
            <p className="mt-2 text-base font-semibold text-[color:var(--text-strong)]">
              {prediction ?? "Ainda nao enviado"}
            </p>
          </div>
          <Button variant="secondary" size="sm">
            Editar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
