import { Clock3 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  getNextMatchPredictionClosesAt,
  isPerMatchPredictionPhase,
} from "@/lib/domain/scoring";
import type { Match, PredictionRule } from "@/lib/domain/types";

function formatCountdown(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}min`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }

  if (minutes > 0) {
    return `${minutes}min ${seconds}s`;
  }

  return `${seconds}s`;
}

export function MatchPredictionCountdownBadge({
  closesAt,
  now,
  compact = false,
}: {
  closesAt: Date;
  now: Date;
  compact?: boolean;
}) {
  const closesInMs = closesAt.getTime() - now.getTime();
  const className = compact
    ? "max-w-full gap-1.5 whitespace-normal normal-case tracking-normal"
    : "gap-1.5 normal-case tracking-normal";

  if (closesInMs <= 0) {
    return (
      <Badge variant="danger" className={className}>
        Palpites encerrados
      </Badge>
    );
  }

  return (
    <Badge
      variant={closesInMs <= 24 * 60 * 60 * 1000 ? "warning" : "success"}
      className={className}
    >
      <Clock3 className="h-3.5 w-3.5 shrink-0" />
      {compact
        ? `Fecha em ${formatCountdown(closesInMs)}`
        : `Fecha em ${formatCountdown(closesInMs)}`}
    </Badge>
  );
}

export function PhaseCountdownBadge({
  rule,
  now,
  matches,
  compact = false,
}: {
  rule?: PredictionRule;
  now: Date;
  matches?: Match[];
  compact?: boolean;
}) {
  const className = compact
    ? "max-w-full gap-1.5 whitespace-normal normal-case tracking-normal"
    : "gap-1.5 normal-case tracking-normal";

  if (!rule) {
    return (
      <Badge variant="neutral" className={className}>
        Sem janela configurada
      </Badge>
    );
  }

  if (rule.status !== "active") {
    return (
      <Badge variant="neutral" className={className}>
        Fase fechada
      </Badge>
    );
  }

  const opensAt = new Date(rule.opensAt);
  const opensInMs = opensAt.getTime() - now.getTime();

  if (opensInMs > 0) {
    return (
      <Badge variant="accent" className={className}>
        Abre em {formatCountdown(opensInMs)}
      </Badge>
    );
  }

  const usesPerMatchClose = Boolean(
    rule.enableMatchPredictions &&
    matches?.some((match) => isPerMatchPredictionPhase(match.phaseId)),
  );
  const closesAt = usesPerMatchClose
    ? getNextMatchPredictionClosesAt(matches ?? [], now)
    : new Date(rule.closesAt);

  if (!closesAt) {
    return (
      <Badge variant="danger" className={className}>
        Palpites encerrados
      </Badge>
    );
  }

  const closesInMs = closesAt.getTime() - now.getTime();

  if (closesInMs <= 0) {
    return (
      <Badge variant="danger" className={className}>
        Palpites encerrados
      </Badge>
    );
  }

  return (
    <Badge
      variant={closesInMs <= 24 * 60 * 60 * 1000 ? "warning" : "success"}
      className={className}
    >
      <Clock3 className="h-3.5 w-3.5 shrink-0" />
      {usesPerMatchClose
        ? compact
          ? `Próximo: ${formatCountdown(closesInMs)}`
          : `Restam ${formatCountdown(closesInMs)} para o próximo jogo`
        : compact
          ? `Restam ${formatCountdown(closesInMs)}`
          : `Restam ${formatCountdown(closesInMs)} para palpitar`}
    </Badge>
  );
}
