"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { RankingRowPredictionsDialog } from "@/components/ranking-row-predictions-dialog";
import { TeamFlag } from "@/components/team-flag";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserAvatar } from "@/components/user-avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getSortedPhases,
  getTeamName,
  getTeamOrPlaceholder,
} from "@/lib/domain/selectors";
import {
  buildLeaderboard,
  buildLiveLeaderboardMovements,
  isMatchPredictionVisible,
  isMatchResultPublic,
  scoreMatchPrediction,
} from "@/lib/domain/scoring";
import type {
  AppSnapshot,
  Match,
  MatchPrediction,
  OfficialResult,
  Phase,
  PredictionRule,
  Profile,
} from "@/lib/domain/types";
import { APP_TIME_ZONE, getDateKeyInAppTimeZone } from "@/lib/formatters";
import { useSandboxSnapshot } from "@/lib/sandbox-storage";

const LIVE_MATCH_STALE_WINDOW_MS = 3 * 60 * 60 * 1000;
const RANKING_REFRESH_INTERVAL_MS = 60 * 1000;
const SHOW_AI_STORAGE_KEY = "bolao-ranking-show-ai";
const SHOW_AI_STORAGE_EVENT = "bolao-ranking-show-ai-change";

function getPositionClasses(position: number) {
  if (position === 1) {
    return "bg-[#f5d36b] text-[#5b4300]";
  }
  if (position === 2) {
    return "bg-[#d7dbe2] text-[#434a54]";
  }
  if (position === 3) {
    return "bg-[#d9ad7c] text-[#5a3412]";
  }
  return "bg-[color:var(--surface-muted)] text-[color:var(--text-strong)]";
}

function subscribeShowAiStorage(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => undefined;

  const handleChange = () => onStoreChange();
  window.addEventListener("storage", handleChange);
  window.addEventListener(SHOW_AI_STORAGE_EVENT, handleChange);

  return () => {
    window.removeEventListener("storage", handleChange);
    window.removeEventListener(SHOW_AI_STORAGE_EVENT, handleChange);
  };
}

function getShowAiStorageSnapshot() {
  if (typeof window === "undefined") return false;

  return window.localStorage.getItem(SHOW_AI_STORAGE_KEY) === "true";
}

function getShowAiServerSnapshot() {
  return false;
}

function LiveMovementPill({ positionDelta }: { positionDelta: number }) {
  const isUp = positionDelta > 0;
  const Icon = isUp ? ArrowUp : ArrowDown;
  const count = Math.abs(positionDelta);
  const label = isUp
    ? `Subiu ${count} ${count === 1 ? "posição" : "posições"} com jogos em andamento`
    : `Desceu ${count} ${count === 1 ? "posição" : "posições"} com jogos em andamento`;

  return (
    <span
      aria-label={label}
      title={label}
      className={`inline-flex min-w-8 items-center justify-center gap-1 text-xs font-bold ${
        isUp
          ? "text-[color:var(--success-strong)]"
          : "text-[color:var(--danger-strong)]"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {count}
    </span>
  );
}

function getMatchStatusLabel(kickoffAt: string, now: Date) {
  const kickoffTime = new Date(kickoffAt).getTime();
  const minutesToKickoff = Math.ceil((kickoffTime - now.getTime()) / 60000);

  if (!Number.isFinite(minutesToKickoff) || minutesToKickoff <= 0) {
    return "Começa agora";
  }

  if (minutesToKickoff > 60) {
    return new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: APP_TIME_ZONE,
    }).format(new Date(kickoffAt));
  }

  return `Começa em ${minutesToKickoff} min`;
}

function getMatchStartsInMs(match: Pick<Match, "kickoffAt">, now: Date) {
  return new Date(match.kickoffAt).getTime() - now.getTime();
}

function isRecentlyStartedMatch(
  match: Pick<Match, "kickoffAt" | "status">,
  now: Date,
) {
  if (match.status === "completed") return false;

  const startsInMs = getMatchStartsInMs(match, now);
  return (
    Number.isFinite(startsInMs) &&
    startsInMs <= 0 &&
    startsInMs >= -LIVE_MATCH_STALE_WINDOW_MS
  );
}

function getDateFromDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1, 12));
}

function addDaysToDateKey(dateKey: string, days: number) {
  const date = getDateFromDateKey(dateKey);
  date.setUTCDate(date.getUTCDate() + days);
  return getDateKeyInAppTimeZone(date.toISOString());
}

function getDaySelectorLabel(dateKey: string) {
  const date = getDateFromDateKey(dateKey);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    timeZone: APP_TIME_ZONE,
  }).format(date);
}

function getCurrentPhaseId(phases: Phase[], now: Date) {
  const nowTime = now.getTime();
  if (!Number.isFinite(nowTime)) return undefined;

  return phases
    .filter((phase) => {
      const startsAt = new Date(phase.startsAt).getTime();
      const endsAt = new Date(phase.endsAt).getTime();

      return (
        Number.isFinite(startsAt) &&
        Number.isFinite(endsAt) &&
        startsAt <= nowTime &&
        nowTime <= endsAt
      );
    })
    .sort((left, right) => right.order - left.order)[0]?.id;
}

function getFeaturedMatchStatusLabel({
  isLive,
  match,
  now,
}: {
  isLive: boolean;
  match: Pick<Match, "kickoffAt" | "status">;
  now: Date;
}) {
  if (match.status === "completed") return "Encerrado";
  if (isLive) return "Ao vivo";

  return getMatchStatusLabel(match.kickoffAt, now);
}

function getUpdatedAgoLabel(updatedAt: string | undefined, now: Date) {
  if (!updatedAt) return "Resultados ainda não sincronizados";

  const updatedAtDate = new Date(updatedAt);
  if (!Number.isFinite(updatedAtDate.getTime())) {
    return "Resultados ainda não sincronizados";
  }

  const elapsedMinutes = Math.max(
    0,
    Math.floor((now.getTime() - updatedAtDate.getTime()) / 60000),
  );

  if (elapsedMinutes === 0) {
    return "Resultados atualizados há menos de 1 minuto atrás";
  }

  return `Resultados atualizados há ${elapsedMinutes} ${
    elapsedMinutes === 1 ? "minuto" : "minutos"
  } atrás`;
}

function UserMatchPredictionBadge({
  prediction,
}: {
  prediction?: Pick<MatchPrediction, "homeScore" | "awayScore">;
}) {
  return (
    <div className="mt-3 flex items-center justify-between gap-3 rounded-md border border-[color:var(--border-subtle)] bg-[color:var(--surface-base)] px-3 py-2">
      <span className="text-[11px] font-bold tracking-[0.14em] text-[color:var(--text-muted)] uppercase">
        Seu palpite
      </span>
      {prediction ? (
        <span className="rounded-md bg-[color:var(--surface-muted)] px-2 py-1 text-sm font-black text-[color:var(--text-strong)]">
          {prediction.homeScore} x {prediction.awayScore}
        </span>
      ) : (
        <span className="text-xs font-medium text-[color:var(--text-muted)]">
          Sem palpite
        </span>
      )}
    </div>
  );
}

interface MatchPredictionScoreRow {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  isFake?: boolean;
  predictedScore: string;
  points: number;
  description: string;
}

interface ScoredMatchRow {
  matchId: string;
  kickoffAt: string;
  homeTeam: string;
  homeTeamCode?: string;
  awayTeam: string;
  awayTeamCode?: string;
  officialScore: string;
  predictedScore: string;
  points: number;
  description: string;
}

function formatScoredMatchDate(kickoffAt: string) {
  const date = new Date(kickoffAt);

  if (!Number.isFinite(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: APP_TIME_ZONE,
  }).format(date);
}

function getMatchPredictionRows({
  match,
  profilesById,
  predictions,
  result,
  rule,
}: {
  match: Match;
  profilesById: Map<string, Profile>;
  predictions: MatchPrediction[];
  result?: OfficialResult;
  rule?: PredictionRule;
}) {
  return predictions
    .filter((prediction) => prediction.matchId === match.id)
    .flatMap((prediction) => {
      const profile = profilesById.get(prediction.userId);
      if (!profile) return [];

      const score =
        result && rule ? scoreMatchPrediction(prediction, result, rule) : null;
      const row: MatchPredictionScoreRow = {
        userId: prediction.userId,
        displayName: profile.fullName,
        predictedScore: `${prediction.homeScore} x ${prediction.awayScore}`,
        points: score?.points ?? 0,
        description: score?.description ?? "Aguardando placar",
      };

      if (profile.avatarUrl) {
        row.avatarUrl = profile.avatarUrl;
      }

      if (profile.isFake !== undefined) {
        row.isFake = profile.isFake;
      }

      return [row];
    })
    .sort((left, right) => {
      if (right.points !== left.points) return right.points - left.points;

      return left.displayName.localeCompare(right.displayName, "pt-BR");
    });
}

function ScoredMatchPointsDialog({
  displayName,
  rows,
  totalPoints,
  variant = "inline",
}: {
  displayName: string;
  rows: ScoredMatchRow[];
  totalPoints: number;
  variant?: "inline" | "card";
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {variant === "card" ? (
          <button
            type="button"
            className="group cursor-pointer rounded-lg bg-[color:var(--surface-muted)] px-3 py-2 text-center transition hover:bg-[color:var(--surface-subtle)] focus-visible:ring-2 focus-visible:ring-[color:var(--accent-soft)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--surface-base)] focus-visible:outline-none"
            aria-label={`Ver partidas pontuadas de ${displayName}`}
          >
            <span className="block text-[10px] font-bold tracking-[0.14em] text-[color:var(--text-muted)] uppercase">
              Pontos
            </span>
            <span className="block text-lg leading-tight font-black text-[color:var(--text-strong)] underline decoration-[color:var(--accent-soft)] underline-offset-4 transition-colors group-hover:text-[color:var(--success-strong)]">
              {totalPoints}
            </span>
          </button>
        ) : (
          <button
            type="button"
            className="inline-flex min-w-12 cursor-pointer items-center justify-center rounded-md px-2 py-1 text-base font-black text-[color:var(--text-strong)] underline decoration-[color:var(--accent-soft)] underline-offset-4 transition hover:bg-[color:var(--surface-muted)] hover:text-[color:var(--success-strong)] focus-visible:text-[color:var(--success-strong)] focus-visible:ring-2 focus-visible:ring-[color:var(--accent-soft)] focus-visible:outline-none"
            aria-label={`Ver partidas pontuadas de ${displayName}`}
          >
            {totalPoints}
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="flex max-h-[82vh] w-[min(94vw,56rem)] flex-col overflow-hidden">
        <DialogHeader className="pr-8">
          <DialogTitle>{displayName}</DialogTitle>
          <DialogDescription>
            Partidas que somaram pontos, em ordem cronológica.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
          {rows.length === 0 ? (
            <p className="rounded-lg bg-[color:var(--surface-muted)] p-4 text-sm text-[color:var(--text-muted)]">
              Nenhuma partida pontuada por este usuário.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-[color:var(--border-subtle)]">
              <Table className="min-w-[680px]">
                <TableHeader className="bg-[color:var(--surface-muted)]">
                  <TableRow>
                    <TableHead>Partida</TableHead>
                    <TableHead className="w-[110px] text-center">
                      Oficial
                    </TableHead>
                    <TableHead className="w-[110px] text-center">
                      Palpite
                    </TableHead>
                    <TableHead className="w-[130px] text-center">
                      Pontos somados
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.matchId}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-xs font-medium text-[color:var(--text-muted)]">
                            {formatScoredMatchDate(row.kickoffAt)}
                          </div>
                          <div className="grid min-w-0 gap-1 sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:gap-2">
                            <span className="inline-flex min-w-0 items-center gap-2 font-medium">
                              <TeamFlag
                                code={row.homeTeamCode}
                                className="h-4 w-4 shrink-0 rounded-full"
                              />
                              <span className="truncate">{row.homeTeam}</span>
                            </span>
                            <span className="hidden text-[color:var(--text-muted)] sm:inline">
                              x
                            </span>
                            <span className="inline-flex min-w-0 items-center gap-2 font-medium sm:justify-end">
                              <span className="truncate sm:text-right">
                                {row.awayTeam}
                              </span>
                              <TeamFlag
                                code={row.awayTeamCode}
                                className="h-4 w-4 shrink-0 rounded-full"
                              />
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="neutral" size="small">
                          {row.officialScore}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        {row.predictedScore}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex min-w-12 justify-center rounded-md bg-[color:var(--success-soft)] px-2 py-1 text-sm font-black text-[color:var(--success-strong)]">
                          +{row.points}
                        </span>
                        <div className="mt-1 text-[11px] font-medium text-[color:var(--text-muted)]">
                          {row.description}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MatchPredictionsDialog({
  homeTeamName,
  awayTeamName,
  resultScore,
  canViewPredictions,
  rows,
}: {
  homeTeamName: string;
  awayTeamName: string;
  resultScore: string;
  canViewPredictions: boolean;
  rows: MatchPredictionScoreRow[];
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3 h-9 w-full rounded-lg bg-[color:var(--surface-base)] text-xs"
        >
          <Eye className="h-4 w-4" />
          Ver palpites
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[82vh] overflow-y-auto">
        <DialogHeader className="pr-8">
          <DialogTitle className="text-lg">
            {homeTeamName} x {awayTeamName}
          </DialogTitle>
          <DialogDescription>
            Placar atual:{" "}
            <span className="font-semibold text-[color:var(--text-strong)]">
              {resultScore}
            </span>
          </DialogDescription>
        </DialogHeader>

        {!canViewPredictions ? (
          <p className="mt-4 rounded-lg bg-[color:var(--surface-muted)] p-4 text-sm text-[color:var(--text-muted)]">
            Palpites liberados após fechamento da janela da fase.
          </p>
        ) : rows.length === 0 ? (
          <p className="mt-4 rounded-lg bg-[color:var(--surface-muted)] p-4 text-sm text-[color:var(--text-muted)]">
            Nenhum palpite encontrado para esta partida.
          </p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-lg border border-[color:var(--border-subtle)]">
            <Table>
              <TableHeader className="bg-[color:var(--surface-muted)]">
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="w-[92px] text-center">
                    Palpite
                  </TableHead>
                  <TableHead className="w-[78px] text-center">Pontos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow
                    key={row.userId}
                    className={
                      row.isFake
                        ? "bg-[color:var(--surface-muted)]/40 opacity-75"
                        : undefined
                    }
                  >
                    <TableCell className="py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <UserAvatar
                          name={row.displayName}
                          avatarUrl={row.avatarUrl}
                          className="h-8 w-8 shrink-0 text-[10px]"
                        />
                        <div className="min-w-0">
                          <div className="line-clamp-2 text-sm leading-snug font-semibold [overflow-wrap:anywhere] break-words">
                            {row.displayName}
                          </div>
                          <div className="text-xs text-[color:var(--text-muted)]">
                            {row.description}
                          </div>
                        </div>
                        {row.isFake ? (
                          <Badge
                            variant="accent"
                            size="small"
                            className="ml-auto shrink-0 tracking-[0.1em]"
                          >
                            IA
                          </Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-center font-semibold">
                      {row.predictedScore}
                    </TableCell>
                    <TableCell className="py-3 text-center">
                      <span
                        className={`inline-flex min-w-10 justify-center rounded-md px-2 py-1 text-sm font-black ${
                          row.points > 0
                            ? "bg-[color:var(--success-soft)] text-[color:var(--success-strong)]"
                            : "bg-[color:var(--surface-muted)] text-[color:var(--text-muted)]"
                        }`}
                      >
                        {row.points > 0 ? `+${row.points}` : "0"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function RulePill({
  label,
  points,
  tone = "neutral",
}: {
  label: string;
  points: number;
  tone?: "neutral" | "accent";
}) {
  return (
    <span
      className={`inline-flex items-center overflow-hidden rounded-md border border-[color:var(--border-subtle)] bg-[color:var(--surface-base)] text-[11px] ${
        tone === "accent"
          ? "text-[color:var(--accent-strong)]"
          : "text-[color:var(--text-muted)]"
      }`}
    >
      <span className="px-2 py-1 leading-tight font-medium tracking-normal normal-case">
        {label}
      </span>
      <span className="border-l border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-2 py-1 leading-tight font-bold tracking-normal text-[color:var(--text-strong)]">
        {points} pts
      </span>
    </span>
  );
}

export function RankingView({
  snapshot,
  currentUserMatchPredictions = [],
  visibleAt,
  resultsLastUpdatedAt,
}: {
  snapshot: AppSnapshot;
  currentUserMatchPredictions?: Pick<
    MatchPrediction,
    "matchId" | "homeScore" | "awayScore"
  >[];
  visibleAt: string;
  resultsLastUpdatedAt?: string;
}) {
  const router = useRouter();
  const sandboxSnapshot = useSandboxSnapshot();
  const activeSnapshot = sandboxSnapshot ?? snapshot;
  const isSandbox = Boolean(sandboxSnapshot);
  const visibleAtDate = new Date(visibleAt);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [currentTime, setCurrentTime] = useState(visibleAtDate);
  const showAi = useSyncExternalStore(
    subscribeShowAiStorage,
    getShowAiStorageSnapshot,
    getShowAiServerSnapshot,
  );
  const todayDateKey = getDateKeyInAppTimeZone(currentTime.toISOString());
  const [selectedDateKey, setSelectedDateKey] = useState(() =>
    getDateKeyInAppTimeZone(visibleAtDate.toISOString()),
  );
  const fakeUserIds = new Set(
    activeSnapshot.profiles
      .filter((profile) => profile.isFake)
      .map((profile) => profile.id),
  );
  const rankingSnapshot = showAi
    ? activeSnapshot
    : {
        ...activeSnapshot,
        profiles: activeSnapshot.profiles.filter(
          (profile) => !fakeUserIds.has(profile.id),
        ),
        memberships: activeSnapshot.memberships.filter(
          (membership) => !fakeUserIds.has(membership.userId),
        ),
        matchPredictions: activeSnapshot.matchPredictions.filter(
          (prediction) => !fakeUserIds.has(prediction.userId),
        ),
        placementPredictions: activeSnapshot.placementPredictions.filter(
          (prediction) => !fakeUserIds.has(prediction.userId),
        ),
      };
  const leaderboard = buildLeaderboard(rankingSnapshot, visibleAtDate);
  const liveMovements = buildLiveLeaderboardMovements(
    rankingSnapshot,
    visibleAtDate,
  );
  const resultsByMatchId = new Map(
    activeSnapshot.results.map((result) => [result.matchId, result]),
  );
  const matchesById = new Map(
    activeSnapshot.matches.map((match) => [match.id, match]),
  );
  const rulesByPhaseId = new Map(
    activeSnapshot.rules.map((rule) => [rule.phaseId, rule]),
  );
  const currentUserPredictionsByMatchId = new Map(
    currentUserMatchPredictions.map((prediction) => [
      prediction.matchId,
      prediction,
    ]),
  );
  const teamsById = new Map(
    activeSnapshot.teams.map((team) => [team.id, team]),
  );
  const approvedUserIds = new Set(
    rankingSnapshot.memberships.map((membership) => membership.userId),
  );
  const profilesById = new Map(
    rankingSnapshot.profiles
      .filter((profile) => approvedUserIds.has(profile.id))
      .map((profile) => [profile.id, profile]),
  );
  const getTeamPredictionView = (teamId?: string) => {
    const team = teamId ? teamsById.get(teamId) : undefined;

    return team ? { name: team.name, code: team.code } : undefined;
  };
  const featuredMatches = activeSnapshot.matches
    .filter((match) => {
      return getDateKeyInAppTimeZone(match.kickoffAt) === selectedDateKey;
    })
    .sort((left, right) => {
      const leftIsLive =
        left.status === "in_progress" ||
        isRecentlyStartedMatch(left, currentTime);
      const rightIsLive =
        right.status === "in_progress" ||
        isRecentlyStartedMatch(right, currentTime);

      if (leftIsLive !== rightIsLive) return leftIsLive ? -1 : 1;

      return (
        new Date(left.kickoffAt).getTime() - new Date(right.kickoffAt).getTime()
      );
    });
  const phases = getSortedPhases(activeSnapshot.phases);
  const currentPhaseId = getCurrentPhaseId(phases, currentTime);
  const phaseRules = phases
    .map((phase) => ({
      phase,
      rule: activeSnapshot.rules.find((item) => item.phaseId === phase.id),
    }))
    .filter((item) => item.rule);
  const getPredictionDialogData = (userId: string) => {
    const visiblePredictions = activeSnapshot.matchPredictions
      .filter((prediction) => {
        if (prediction.userId !== userId) return false;

        const match = activeSnapshot.matches.find(
          (item) => item.id === prediction.matchId,
        );
        const rule = activeSnapshot.rules.find(
          (item) => item.phaseId === match?.phaseId,
        );

        return isMatchPredictionVisible(rule, match, visibleAtDate);
      })
      .map((prediction) => {
        const match = activeSnapshot.matches.find(
          (item) => item.id === prediction.matchId,
        );
        const result = resultsByMatchId.get(prediction.matchId);
        const phase = phases.find((item) => item.id === match?.phaseId);
        const homeTeam = match?.homeTeamId
          ? teamsById.get(match.homeTeamId)
          : undefined;
        const awayTeam = match?.awayTeamId
          ? teamsById.get(match.awayTeamId)
          : undefined;

        return {
          matchId: prediction.matchId,
          phaseId: match?.phaseId ?? "",
          phaseName: phase?.name ?? "Sem fase",
          phaseOrder: phase?.order ?? Number.MAX_SAFE_INTEGER,
          groupName: match?.stageGroup,
          kickoffAt: match?.kickoffAt ?? "",
          homeTeam: getTeamName(activeSnapshot.teams, match?.homeTeamId),
          homeTeamCode: homeTeam?.code,
          awayTeam: getTeamName(activeSnapshot.teams, match?.awayTeamId),
          awayTeamCode: awayTeam?.code,
          predictedScore: `${prediction.homeScore} x ${prediction.awayScore}`,
          officialScore: result
            ? `${result.homeScore} x ${result.awayScore}`
            : "-",
        };
      });
    const placementPrediction = activeSnapshot.placementPredictions.find(
      (prediction) => prediction.userId === userId,
    );
    const visiblePlacementPrediction = placementPrediction
      ? {
          champion: getTeamPredictionView(placementPrediction.championTeamId),
          runnerUp: getTeamPredictionView(placementPrediction.runnerUpTeamId),
          thirdPlace: getTeamPredictionView(
            placementPrediction.thirdPlaceTeamId,
          ),
          officialChampion: activeSnapshot.placementResult.publishedAt
            ? getTeamPredictionView(
                activeSnapshot.placementResult.championTeamId,
              )
            : undefined,
          officialRunnerUp: activeSnapshot.placementResult.publishedAt
            ? getTeamPredictionView(
                activeSnapshot.placementResult.runnerUpTeamId,
              )
            : undefined,
          officialThirdPlace: activeSnapshot.placementResult.publishedAt
            ? getTeamPredictionView(
                activeSnapshot.placementResult.thirdPlaceTeamId,
              )
            : undefined,
        }
      : undefined;

    return { visiblePredictions, visiblePlacementPrediction };
  };
  const getScoredMatchRowsForUser = (userId: string): ScoredMatchRow[] =>
    rankingSnapshot.matchPredictions
      .filter((prediction) => prediction.userId === userId)
      .flatMap((prediction) => {
        const match = matchesById.get(prediction.matchId);
        const result = resultsByMatchId.get(prediction.matchId);

        if (
          !match ||
          !result ||
          !isMatchResultPublic(match, result, visibleAtDate)
        ) {
          return [];
        }

        const rule = rulesByPhaseId.get(match.phaseId);
        if (!rule) return [];

        const score = scoreMatchPrediction(prediction, result, rule);
        if (score.points <= 0) return [];

        const homeTeam = match.homeTeamId
          ? teamsById.get(match.homeTeamId)
          : undefined;
        const awayTeam = match.awayTeamId
          ? teamsById.get(match.awayTeamId)
          : undefined;

        return [
          {
            matchId: match.id,
            kickoffAt: match.kickoffAt,
            homeTeam: getTeamOrPlaceholder(
              activeSnapshot.teams,
              match.homeTeamId,
              match.homePlaceholder,
            ),
            homeTeamCode: homeTeam?.code,
            awayTeam: getTeamOrPlaceholder(
              activeSnapshot.teams,
              match.awayTeamId,
              match.awayPlaceholder,
            ),
            awayTeamCode: awayTeam?.code,
            officialScore: `${result.homeScore} x ${result.awayScore}`,
            predictedScore: `${prediction.homeScore} x ${prediction.awayScore}`,
            points: score.points,
            description: score.description,
          },
        ];
      })
      .sort((left, right) => {
        const leftTime = new Date(left.kickoffAt).getTime();
        const rightTime = new Date(right.kickoffAt).getTime();

        if (Number.isFinite(leftTime) && Number.isFinite(rightTime)) {
          return leftTime - rightTime;
        }

        return left.matchId.localeCompare(right.matchId);
      });

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrentTime(new Date());
      router.refresh();
    }, RANKING_REFRESH_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [router]);

  const toggleShowAi = () => {
    window.localStorage.setItem(SHOW_AI_STORAGE_KEY, String(!showAi));
    window.dispatchEvent(new Event(SHOW_AI_STORAGE_EVENT));
  };

  const openDatePicker = () => {
    const input = dateInputRef.current;
    if (!input) return;

    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }

    input.click();
  };

  return (
    <div className="space-y-6">
      {isSandbox ? (
        <Badge variant="accent">Sandbox ativo: ranking simulado</Badge>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_320px] xl:gap-12">
        <div className="space-y-6">
          <Card>
            <CardHeader className="gap-4 space-y-0 sm:flex sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <div className="text-lg font-bold">Ranking</div>
                <p className="text-sm text-[color:var(--text-muted)]">
                  {getUpdatedAgoLabel(resultsLastUpdatedAt, currentTime)}
                </p>
              </div>
              <button
                type="button"
                aria-pressed={showAi}
                onClick={toggleShowAi}
                className="inline-flex h-9 shrink-0 items-center gap-2 self-start rounded-full border border-[color:var(--border-subtle)] bg-[color:var(--surface-base)] px-3 text-xs font-semibold text-[color:var(--text-muted)] transition hover:bg-[color:var(--surface-muted)] aria-pressed:border-[color:var(--accent-soft)] aria-pressed:bg-[color:var(--accent-muted)] aria-pressed:text-[color:var(--accent-strong)]"
              >
                <span
                  className={`relative h-4 w-7 rounded-full transition ${
                    showAi
                      ? "bg-[color:var(--accent-strong)]"
                      : "bg-[color:var(--border-subtle)]"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-3 w-3 rounded-full bg-[color:var(--switch-thumb)] transition ${
                      showAi ? "left-3.5" : "left-0.5"
                    }`}
                  />
                </span>
                Mostrar IA
              </button>
            </CardHeader>
            <CardContent className="overflow-hidden rounded-lg border border-[color:var(--border-subtle)] p-0">
              <div className="divide-y divide-[color:var(--border-subtle)] md:hidden">
                {leaderboard.map((entry, index) => {
                  const liveMovement = liveMovements.get(entry.userId);
                  const showPosition =
                    index === 0 ||
                    leaderboard[index - 1]?.position !== entry.position;
                  const { visiblePredictions, visiblePlacementPrediction } =
                    getPredictionDialogData(entry.userId);
                  const scoredMatchRows = getScoredMatchRowsForUser(
                    entry.userId,
                  );

                  return (
                    <div
                      key={entry.userId}
                      className={`p-4 ${
                        entry.isFake
                          ? "bg-[color:var(--surface-muted)]/40 opacity-75"
                          : ""
                      }`}
                    >
                      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                        <div className="min-w-0 overflow-hidden">
                          <div className="flex min-w-0 items-center gap-3">
                            <UserAvatar
                              name={entry.displayName}
                              avatarUrl={entry.avatarUrl}
                              className="h-10 w-10 shrink-0 text-xs"
                            />
                            <div className="w-0 min-w-0 flex-1 overflow-hidden">
                              <div className="flex min-w-0 items-start gap-2">
                                <div className="line-clamp-2 max-w-full min-w-0 flex-1 text-sm leading-snug font-semibold [overflow-wrap:anywhere] break-words text-[color:var(--text-strong)] sm:text-base">
                                  {entry.displayName}
                                </div>
                                {entry.isFake ? (
                                  <Badge
                                    variant="accent"
                                    size="small"
                                    className="shrink-0 tracking-[0.1em]"
                                  >
                                    IA
                                  </Badge>
                                ) : null}
                              </div>
                              <div className="mt-1 flex items-center gap-2">
                                {showPosition ? (
                                  <span
                                    className={`inline-flex min-w-9 items-center justify-center rounded-md px-2 py-1 text-sm font-semibold ${getPositionClasses(entry.position)}`}
                                  >
                                    {entry.position}
                                  </span>
                                ) : (
                                  <span className="inline-flex min-w-9" />
                                )}
                                {liveMovement ? (
                                  <LiveMovementPill
                                    positionDelta={liveMovement.positionDelta}
                                  />
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-start gap-2">
                          <ScoredMatchPointsDialog
                            displayName={entry.displayName}
                            rows={scoredMatchRows}
                            totalPoints={entry.totalPoints}
                            variant="card"
                          />
                          <RankingRowPredictionsDialog
                            displayName={entry.displayName}
                            matchPredictions={visiblePredictions}
                            placementPrediction={visiblePlacementPrediction}
                            currentPhaseId={currentPhaseId}
                          />
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2 text-center">
                        <div className="min-w-0 overflow-hidden rounded-lg border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-2 py-2 sm:px-3">
                          <div className="text-[9px] leading-tight font-bold tracking-[0.06em] text-[color:var(--text-muted)] uppercase sm:text-[10px] sm:tracking-[0.12em]">
                            Placar exato
                          </div>
                          <div className="mt-1 text-base font-bold">
                            {entry.exactHits}
                          </div>
                        </div>
                        <div className="min-w-0 overflow-hidden rounded-lg border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-2 py-2 sm:px-3">
                          <div className="text-[9px] leading-tight font-bold tracking-[0.06em] text-[color:var(--text-muted)] uppercase sm:text-[10px] sm:tracking-[0.12em]">
                            Vencedor/empate
                          </div>
                          <div className="mt-1 text-base font-bold">
                            {entry.outcomeHits}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <Table>
                  <TableHeader className="bg-[color:var(--surface-muted)]">
                    <TableRow>
                      <TableHead>Posição</TableHead>
                      <TableHead>Participante</TableHead>
                      <TableHead className="text-center">
                        Placar exato
                      </TableHead>
                      <TableHead className="text-center">
                        Acertou vencedor / empate
                      </TableHead>
                      <TableHead className="text-center font-bold">
                        Pontos
                      </TableHead>
                      <TableHead className="w-[80px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaderboard.map((entry, index) => {
                      const liveMovement = liveMovements.get(entry.userId);
                      const showPosition =
                        index === 0 ||
                        leaderboard[index - 1]?.position !== entry.position;
                      const { visiblePredictions, visiblePlacementPrediction } =
                        getPredictionDialogData(entry.userId);
                      const scoredMatchRows = getScoredMatchRowsForUser(
                        entry.userId,
                      );

                      return (
                        <TableRow
                          key={entry.userId}
                          className={
                            entry.isFake
                              ? "bg-[color:var(--surface-muted)]/40 opacity-75"
                              : undefined
                          }
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {showPosition ? (
                                <span
                                  className={`inline-flex min-w-10 items-center justify-center rounded-md px-2 py-1 font-semibold ${getPositionClasses(entry.position)}`}
                                >
                                  {entry.position}
                                </span>
                              ) : (
                                <span className="inline-flex min-w-10" />
                              )}
                              {liveMovement ? (
                                <LiveMovementPill
                                  positionDelta={liveMovement.positionDelta}
                                />
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold">
                            <div className="flex items-center gap-3">
                              <UserAvatar
                                name={entry.displayName}
                                avatarUrl={entry.avatarUrl}
                                className="h-9 w-9 text-xs"
                              />
                              <span>{entry.displayName}</span>
                              {entry.isFake ? (
                                <Badge
                                  variant="accent"
                                  size="small"
                                  className="tracking-[0.1em]"
                                >
                                  IA
                                </Badge>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {entry.exactHits}
                          </TableCell>
                          <TableCell className="text-center">
                            {entry.outcomeHits}
                          </TableCell>
                          <TableCell className="text-center">
                            <ScoredMatchPointsDialog
                              displayName={entry.displayName}
                              rows={scoredMatchRows}
                              totalPoints={entry.totalPoints}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <RankingRowPredictionsDialog
                              displayName={entry.displayName}
                              matchPredictions={visiblePredictions}
                              placementPrediction={visiblePlacementPrediction}
                              currentPhaseId={currentPhaseId}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-2">
              <div className="text-lg font-bold">Regras</div>
              <p className="text-sm text-[color:var(--text-muted)]">
                Placar exato vale quando os dois placares batem. Acertou
                vencedor / empate vale quando o vencedor ou empate está correto,
                mas o placar não. Se o placar exato bater, vale só Placar exato,
                sem somar com Acertou vencedor / empate.
              </p>
              <p className="text-sm text-[color:var(--text-muted)]">
                Palpites de cada fase só são aceitos antes da primeira partida
                da fase começar.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="overflow-hidden rounded-lg border border-[color:var(--border-subtle)]">
                {phaseRules.map(({ phase, rule }) => (
                  <div
                    key={phase.id}
                    className="grid gap-3 border-b border-[color:var(--border-subtle)] px-4 py-3 last:border-b-0 md:grid-cols-[1fr_auto]"
                  >
                    <div className="text-sm font-semibold text-[color:var(--text-strong)]">
                      {phase.name}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {rule?.enableMatchPredictions ? (
                        <>
                          <RulePill
                            label="Placar exato"
                            points={rule.scoring.exactScore}
                          />
                          <RulePill
                            label="Acertou vencedor / empate"
                            points={rule.scoring.correctOutcome}
                          />
                        </>
                      ) : null}

                      {rule?.enablePlacementPredictions ? (
                        <>
                          <RulePill
                            label="Campeão"
                            points={rule.scoring.champion}
                          />
                          <RulePill
                            label="Vice"
                            points={rule.scoring.runnerUp}
                          />
                          <RulePill
                            label="3º"
                            points={rule.scoring.thirdPlace}
                          />
                        </>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-1 text-xs text-[color:var(--text-muted)]">
                <p>
                  Não pontua quando nem o placar nem o vencedor/empate forem
                  acertados.
                </p>
                <p>
                  Desempate: Placar exato, depois Acertou vencedor / empate.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="space-y-3">
              <div className="text-lg font-bold">Partidas</div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex items-center rounded-xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-base)] p-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg"
                    aria-label="Dia anterior"
                    onClick={() =>
                      setSelectedDateKey((current) =>
                        addDaysToDateKey(current, -1),
                      )
                    }
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 min-w-[116px] rounded-lg px-2 text-xs"
                    onClick={openDatePicker}
                  >
                    <CalendarDays className="h-4 w-4" />
                    {getDaySelectorLabel(selectedDateKey)}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg"
                    aria-label="Próximo dia"
                    onClick={() =>
                      setSelectedDateKey((current) =>
                        addDaysToDateKey(current, 1),
                      )
                    }
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <input
                    ref={dateInputRef}
                    type="date"
                    value={selectedDateKey}
                    onChange={(event) => {
                      if (event.target.value) {
                        setSelectedDateKey(event.target.value);
                      }
                    }}
                    className="pointer-events-none absolute inset-x-10 bottom-0 h-0 w-0 opacity-0"
                    tabIndex={-1}
                    aria-hidden="true"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10"
                  disabled={selectedDateKey === todayDateKey}
                  onClick={() => setSelectedDateKey(todayDateKey)}
                >
                  Hoje
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {featuredMatches.length === 0 ? (
                <p className="text-sm text-[color:var(--text-muted)]">
                  Nenhuma partida marcada para esta data.
                </p>
              ) : (
                featuredMatches.map((match) => {
                  const result = resultsByMatchId.get(match.id);
                  const isLive =
                    match.status === "in_progress" ||
                    isRecentlyStartedMatch(match, currentTime);
                  const homeTeam = match.homeTeamId
                    ? teamsById.get(match.homeTeamId)
                    : undefined;
                  const awayTeam = match.awayTeamId
                    ? teamsById.get(match.awayTeamId)
                    : undefined;
                  const homeTeamName = getTeamOrPlaceholder(
                    activeSnapshot.teams,
                    match.homeTeamId,
                    match.homePlaceholder,
                  );
                  const awayTeamName = getTeamOrPlaceholder(
                    activeSnapshot.teams,
                    match.awayTeamId,
                    match.awayPlaceholder,
                  );
                  const currentUserPrediction =
                    currentUserPredictionsByMatchId.get(match.id);
                  const rule = activeSnapshot.rules.find(
                    (item) => item.phaseId === match.phaseId,
                  );
                  const canViewPredictions = isMatchPredictionVisible(
                    rule,
                    match,
                    visibleAtDate,
                  );
                  const matchPredictionRows = canViewPredictions
                    ? getMatchPredictionRows({
                        match,
                        profilesById,
                        predictions: rankingSnapshot.matchPredictions,
                        result,
                        rule,
                      })
                    : [];
                  const resultScore = result
                    ? `${result.homeScore} x ${result.awayScore}`
                    : "Sem placar";

                  return (
                    <div
                      key={match.id}
                      className="rounded-lg bg-[color:var(--surface-muted)] p-3"
                    >
                      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-2">
                        <div className="flex min-w-0 flex-col items-center gap-2 text-center">
                          <TeamFlag
                            code={homeTeam?.code}
                            className="h-5 w-5 shrink-0 rounded-full"
                          />
                          <div className="line-clamp-2 min-h-[2.25rem] text-sm leading-tight font-semibold [overflow-wrap:anywhere] break-words text-[color:var(--text-strong)]">
                            {homeTeamName}
                          </div>
                        </div>

                        <div className="flex min-w-0 flex-col items-center gap-1 pt-0.5">
                          <span
                            className={`max-w-24 text-center text-[10px] leading-tight font-bold tracking-[0.08em] uppercase ${
                              isLive
                                ? "text-[color:var(--success-strong)]"
                                : "text-[color:var(--accent-strong)]"
                            }`}
                          >
                            {getFeaturedMatchStatusLabel({
                              isLive,
                              match,
                              now: currentTime,
                            })}
                          </span>
                          <div className="rounded-md bg-[color:var(--surface-base)] px-2.5 py-1 text-sm font-black text-[color:var(--text-strong)]">
                            {result
                              ? `${result.homeScore} x ${result.awayScore}`
                              : "x"}
                          </div>
                        </div>

                        <div className="flex min-w-0 flex-col items-center gap-2 text-center">
                          <TeamFlag
                            code={awayTeam?.code}
                            className="h-5 w-5 shrink-0 rounded-full"
                          />
                          <div className="line-clamp-2 min-h-[2.25rem] text-sm leading-tight font-semibold [overflow-wrap:anywhere] break-words text-[color:var(--text-strong)]">
                            {awayTeamName}
                          </div>
                        </div>
                      </div>
                      <UserMatchPredictionBadge
                        prediction={currentUserPrediction}
                      />
                      <MatchPredictionsDialog
                        homeTeamName={homeTeamName}
                        awayTeamName={awayTeamName}
                        resultScore={resultScore}
                        canViewPredictions={canViewPredictions}
                        rows={matchPredictionRows}
                      />
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
