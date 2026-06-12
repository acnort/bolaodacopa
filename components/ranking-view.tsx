"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { RankingRowPredictionsDialog } from "@/components/ranking-row-predictions-dialog";
import { TeamFlag } from "@/components/team-flag";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
  isPhasePredictionVisible,
} from "@/lib/domain/scoring";
import type { AppSnapshot, Match, MatchPrediction } from "@/lib/domain/types";
import { APP_TIME_ZONE, getDateKeyInAppTimeZone } from "@/lib/formatters";
import { useSandboxSnapshot } from "@/lib/sandbox-storage";

const LIVE_MATCH_STALE_WINDOW_MS = 3 * 60 * 60 * 1000;
const RANKING_REFRESH_INTERVAL_MS = 60 * 1000;

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

function getDaySelectorLabel(dateKey: string, todayKey: string) {
  const date = getDateFromDateKey(dateKey);
  const formatted = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    timeZone: APP_TIME_ZONE,
  }).format(date);

  return dateKey === todayKey ? `Hoje, ${formatted}` : formatted;
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
  const todayDateKey = getDateKeyInAppTimeZone(currentTime.toISOString());
  const [selectedDateKey, setSelectedDateKey] = useState(() =>
    getDateKeyInAppTimeZone(visibleAtDate.toISOString()),
  );
  const leaderboard = buildLeaderboard(activeSnapshot, visibleAtDate);
  const liveMovements = buildLiveLeaderboardMovements(
    activeSnapshot,
    visibleAtDate,
  );
  const resultsByMatchId = new Map(
    activeSnapshot.results.map((result) => [result.matchId, result]),
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
  const phaseRules = phases
    .map((phase) => ({
      phase,
      rule: activeSnapshot.rules.find((item) => item.phaseId === phase.id),
    }))
    .filter((item) => item.rule);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrentTime(new Date());
      router.refresh();
    }, RANKING_REFRESH_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [router]);

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

      <div className="grid gap-12 xl:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="text-lg font-bold">Ranking</div>
              <p className="text-sm text-[color:var(--text-muted)]">
                {getUpdatedAgoLabel(resultsLastUpdatedAt, currentTime)}
              </p>
            </CardHeader>
            <CardContent className="overflow-hidden rounded-lg border border-[color:var(--border-subtle)] p-0">
              <div className="overflow-x-auto">
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
                      const visiblePredictions = activeSnapshot.matchPredictions
                        .filter((prediction) => {
                          if (prediction.userId !== entry.userId) return false;

                          const match = activeSnapshot.matches.find(
                            (item) => item.id === prediction.matchId,
                          );
                          const rule = activeSnapshot.rules.find(
                            (item) => item.phaseId === match?.phaseId,
                          );

                          return isPhasePredictionVisible(rule, visibleAtDate);
                        })
                        .map((prediction) => {
                          const match = activeSnapshot.matches.find(
                            (item) => item.id === prediction.matchId,
                          );
                          const result = resultsByMatchId.get(
                            prediction.matchId,
                          );
                          const phase = phases.find(
                            (item) => item.id === match?.phaseId,
                          );
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
                            homeTeam: getTeamName(
                              activeSnapshot.teams,
                              match?.homeTeamId,
                            ),
                            homeTeamCode: homeTeam?.code,
                            awayTeam: getTeamName(
                              activeSnapshot.teams,
                              match?.awayTeamId,
                            ),
                            awayTeamCode: awayTeam?.code,
                            predictedScore: `${prediction.homeScore} x ${prediction.awayScore}`,
                            officialScore: result
                              ? `${result.homeScore} x ${result.awayScore}`
                              : "-",
                          };
                        });
                      const placementPrediction =
                        activeSnapshot.placementPredictions.find(
                          (prediction) => prediction.userId === entry.userId,
                        );
                      const visiblePlacementPrediction = placementPrediction
                        ? {
                            champion: getTeamPredictionView(
                              placementPrediction.championTeamId,
                            ),
                            runnerUp: getTeamPredictionView(
                              placementPrediction.runnerUpTeamId,
                            ),
                            thirdPlace: getTeamPredictionView(
                              placementPrediction.thirdPlaceTeamId,
                            ),
                            officialChampion: activeSnapshot.placementResult
                              .publishedAt
                              ? getTeamPredictionView(
                                  activeSnapshot.placementResult.championTeamId,
                                )
                              : undefined,
                            officialRunnerUp: activeSnapshot.placementResult
                              .publishedAt
                              ? getTeamPredictionView(
                                  activeSnapshot.placementResult.runnerUpTeamId,
                                )
                              : undefined,
                            officialThirdPlace: activeSnapshot.placementResult
                              .publishedAt
                              ? getTeamPredictionView(
                                  activeSnapshot.placementResult
                                    .thirdPlaceTeamId,
                                )
                              : undefined,
                          }
                        : undefined;

                      return (
                        <TableRow key={entry.userId}>
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
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {entry.exactHits}
                          </TableCell>
                          <TableCell className="text-center">
                            {entry.outcomeHits}
                          </TableCell>
                          <TableCell className="text-md text-center font-bold">
                            {entry.totalPoints}
                          </TableCell>
                          <TableCell className="text-right">
                            <RankingRowPredictionsDialog
                              displayName={entry.displayName}
                              matchPredictions={visiblePredictions}
                              placementPrediction={visiblePlacementPrediction}
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
                    {getDaySelectorLabel(selectedDateKey, todayDateKey)}
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
                  const currentUserPrediction =
                    currentUserPredictionsByMatchId.get(match.id);

                  return (
                    <div
                      key={match.id}
                      className="rounded-lg bg-[color:var(--surface-muted)] p-3"
                    >
                      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <TeamFlag
                              code={homeTeam?.code}
                              className="h-4 w-4 shrink-0 rounded-full"
                            />
                            <span className="truncate text-sm font-semibold">
                              {getTeamOrPlaceholder(
                                activeSnapshot.teams,
                                match.homeTeamId,
                                match.homePlaceholder,
                              )}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <div className="rounded-md bg-[color:var(--surface-base)] px-2.5 py-1 text-sm font-black text-[color:var(--text-strong)]">
                            {result
                              ? `${result.homeScore} x ${result.awayScore}`
                              : "x"}
                          </div>
                          <span
                            className={`text-[10px] font-bold tracking-[0.14em] whitespace-nowrap uppercase ${
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
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center justify-end gap-2">
                            <span className="truncate text-right text-sm font-semibold">
                              {getTeamOrPlaceholder(
                                activeSnapshot.teams,
                                match.awayTeamId,
                                match.awayPlaceholder,
                              )}
                            </span>
                            <TeamFlag
                              code={awayTeam?.code}
                              className="h-4 w-4 shrink-0 rounded-full"
                            />
                          </div>
                        </div>
                      </div>
                      <UserMatchPredictionBadge
                        prediction={currentUserPrediction}
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
