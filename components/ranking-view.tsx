"use client";

import { RankingRowPredictionsDialog } from "@/components/ranking-row-predictions-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getSortedPhases, getTeamName } from "@/lib/domain/selectors";
import {
  buildLeaderboard,
  buildScoreEntries,
  isMatchResultPublic,
} from "@/lib/domain/scoring";
import type { AppSnapshot } from "@/lib/domain/types";
import { useSandboxSnapshot } from "@/lib/sandbox-storage";

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

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
      className={`inline-flex items-center overflow-hidden rounded-md border border-[color:var(--border-subtle)] bg-[color:var(--surface-base)] text-xs ${
        tone === "accent"
          ? "text-[color:var(--accent-strong)]"
          : "text-[color:var(--text-muted)]"
      }`}
    >
      <span className="px-2 py-1 font-medium tracking-normal normal-case">
        {label}
      </span>
      <span className="border-l border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] px-2 py-1 font-bold tracking-normal text-[color:var(--text-strong)]">
        {points} pts
      </span>
    </span>
  );
}

export function RankingView({
  snapshot,
  visibleAt,
}: {
  snapshot: AppSnapshot;
  visibleAt: string;
}) {
  const sandboxSnapshot = useSandboxSnapshot();
  const activeSnapshot = sandboxSnapshot ?? snapshot;
  const isSandbox = Boolean(sandboxSnapshot);
  const visibleAtDate = new Date(visibleAt);
  const leaderboard = buildLeaderboard(activeSnapshot, visibleAtDate);
  const latestScores = buildScoreEntries(activeSnapshot, visibleAtDate)
    .slice(-8)
    .reverse();
  const resultsByMatchId = new Map(
    activeSnapshot.results.map((result) => [result.matchId, result]),
  );
  const phases = getSortedPhases(activeSnapshot.phases);
  const phaseRules = phases
    .map((phase) => ({
      phase,
      rule: activeSnapshot.rules.find((item) => item.phaseId === phase.id),
    }))
    .filter((item) => item.rule);

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
            </CardHeader>
            <CardContent className="overflow-hidden rounded-lg border border-[color:var(--border-subtle)] p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-[color:var(--surface-muted)]">
                    <TableRow>
                      <TableHead>Posição</TableHead>
                      <TableHead>Participante</TableHead>
                      <TableHead className="text-center">Exatos</TableHead>
                      <TableHead className="text-center">Resultados</TableHead>
                      <TableHead className="text-center font-bold">
                        Pontos
                      </TableHead>
                      <TableHead className="w-[80px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaderboard.map((entry) => {
                      const completedPredictions =
                        activeSnapshot.matchPredictions
                          .filter((prediction) => {
                            if (prediction.userId !== entry.userId)
                              return false;

                            const match = activeSnapshot.matches.find(
                              (item) => item.id === prediction.matchId,
                            );
                            const result = resultsByMatchId.get(
                              prediction.matchId,
                            );

                            return isMatchResultPublic(
                              match,
                              result,
                              visibleAtDate,
                            );
                          })
                          .map((prediction) => {
                            const match = activeSnapshot.matches.find(
                              (item) => item.id === prediction.matchId,
                            );
                            const result = resultsByMatchId.get(
                              prediction.matchId,
                            );

                            return {
                              matchId: prediction.matchId,
                              phaseId: match?.phaseId ?? "",
                              phaseName:
                                phases.find(
                                  (phase) => phase.id === match?.phaseId,
                                )?.name ?? "Sem fase",
                              homeTeam: getTeamName(
                                activeSnapshot.teams,
                                match?.homeTeamId,
                              ),
                              awayTeam: getTeamName(
                                activeSnapshot.teams,
                                match?.awayTeamId,
                              ),
                              predictedScore: `${prediction.homeScore} x ${prediction.awayScore}`,
                              officialScore: result
                                ? `${result.homeScore} x ${result.awayScore}`
                                : "-",
                            };
                          });

                      return (
                        <TableRow key={entry.userId}>
                          <TableCell>
                            <span
                              className={`inline-flex min-w-10 items-center justify-center rounded-md px-2 py-1 font-semibold ${getPositionClasses(entry.position)}`}
                            >
                              {entry.position}
                            </span>
                          </TableCell>
                          <TableCell className="font-semibold">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--surface-subtle)] text-xs font-bold tracking-[0.14em] text-[color:var(--text-strong)]">
                                {getInitials(entry.displayName)}
                              </div>
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
                              predictions={completedPredictions}
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
            <CardHeader>
              <div className="text-lg font-bold">Pontuação</div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="overflow-hidden rounded-lg border border-[color:var(--border-subtle)]">
                {phaseRules.map(({ phase, rule }) => (
                  <div
                    key={phase.id}
                    className="grid gap-3 border-b border-[color:var(--border-subtle)] px-4 py-3 last:border-b-0 md:grid-cols-[1fr_auto]"
                  >
                    <div className="font-semibold text-[color:var(--text-strong)]">
                      {phase.name}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {rule?.enableMatchPredictions ? (
                        <>
                          <RulePill
                            label="Exato"
                            points={rule.scoring.exactScore}
                          />
                          <RulePill
                            label="Resultado"
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
              <p className="text-xs text-[color:var(--text-muted)]">
                Desempate: mais exatos, depois mais resultados.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="text-lg font-bold">Últimas pontuações</div>
          </CardHeader>
          <CardContent className="space-y-3">
            {latestScores.map((entry) => (
              <div
                key={entry.id}
                className="rounded-lg bg-[color:var(--surface-muted)] p-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold text-[color:var(--text-strong)]">
                    {entry.description}
                  </p>
                  <Badge
                    variant={entry.points > 0 ? "success" : "danger"}
                    size="small"
                    className="font-bold"
                  >
                    {entry.points} pts
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-[color:var(--text-muted)]">
                  {entry.sourceType === "match" ? "Partida" : "Palpite final"}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
