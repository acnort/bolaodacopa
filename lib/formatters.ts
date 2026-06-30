import { APP_TIME_ZONE } from "@/lib/app-time";

export { APP_TIME_ZONE };

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: APP_TIME_ZONE,
  }).format(new Date(value));
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: APP_TIME_ZONE,
  }).format(new Date(value));
}

export function formatPhaseWindow(opensAt: string, closesAt: string) {
  return `${formatDate(opensAt)} - ${formatDate(closesAt)}`;
}

export function formatSectionDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    timeZone: APP_TIME_ZONE,
  }).format(new Date(value));
}

export function getDateKeyInAppTimeZone(value: string) {
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(new Date(value));
}

export function formatScore(homeScore: number, awayScore: number) {
  return `${homeScore} x ${awayScore}`;
}

export function getTotalScoreLabel(
  result:
    | {
        homeScore: number;
        awayScore: number;
        totalHomeScore?: number;
        totalAwayScore?: number;
      }
    | undefined,
) {
  if (
    result?.totalHomeScore === undefined ||
    result.totalAwayScore === undefined
  ) {
    return undefined;
  }

  if (
    result.totalHomeScore === result.homeScore &&
    result.totalAwayScore === result.awayScore
  ) {
    return undefined;
  }

  return formatScore(result.totalHomeScore, result.totalAwayScore);
}
