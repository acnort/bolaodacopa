"use client";

import { useMemo, useState } from "react";

import { ClearResultsDialog } from "@/components/forms/clear-results-dialog";
import { OfficialResultForm } from "@/components/forms/official-result-form";
import { PlacementResultForm } from "@/components/forms/placement-result-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AppSnapshot } from "@/lib/domain/types";
import { getSortedPhases, getTeamName } from "@/lib/domain/selectors";
import { formatDateTime } from "@/lib/formatters";

export function AdminResultsManager({ snapshot }: { snapshot: AppSnapshot }) {
  const phases = getSortedPhases(snapshot.phases);
  const [phaseId, setPhaseId] = useState("all");
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");

  const filteredMatches = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return snapshot.matches.filter((match) => {
      const result = snapshot.results.find((item) => item.matchId === match.id);
      const homeTeam = getTeamName(snapshot.teams, match.homeTeamId);
      const awayTeam = getTeamName(snapshot.teams, match.awayTeamId);
      const matchesPhase = phaseId === "all" || match.phaseId === phaseId;
      const matchesStatus =
        status === "all" ||
        (status === "published" && result) ||
        (status === "pending" && !result);
      const matchesQuery =
        !normalizedQuery ||
        `${homeTeam} ${awayTeam} ${match.roundLabel} ${match.venue}`
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesPhase && matchesStatus && matchesQuery;
    });
  }, [
    phaseId,
    query,
    snapshot.matches,
    snapshot.results,
    snapshot.teams,
    status,
  ]);

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-2 xl:gap-12">
        <Card>
          <CardHeader>
            <CardTitle>Pódio</CardTitle>
          </CardHeader>
          <CardContent>
            <PlacementResultForm
              competitionId={snapshot.competition.id}
              teams={snapshot.teams}
              defaults={snapshot.placementResult}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sync</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-[color:var(--text-muted)]">
            <div>
              Pódio:{" "}
              {snapshot.placementResult.publishedAt
                ? formatDateTime(snapshot.placementResult.publishedAt)
                : "não publicado"}
            </div>
            <div>
              Resultados publicados: {snapshot.results.length}/
              {snapshot.matches.length}
            </div>
            <ClearResultsDialog
              disabled={
                snapshot.results.length === 0 &&
                !snapshot.placementResult.publishedAt
              }
            />
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Resultados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_220px_180px]">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por time, rodada ou estádio"
            />
            <Select value={phaseId} onValueChange={setPhaseId}>
              <SelectTrigger>
                <SelectValue placeholder="Fase" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as fases</SelectItem>
                {phases.map((phase) => (
                  <SelectItem key={phase.id} value={phase.id}>
                    {phase.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="published">Publicados</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {filteredMatches.map((match) => {
              const result = snapshot.results.find(
                (item) => item.matchId === match.id,
              );
              const homeTeam = getTeamName(snapshot.teams, match.homeTeamId);
              const awayTeam = getTeamName(snapshot.teams, match.awayTeamId);

              return (
                <div
                  key={match.id}
                  className="rounded-lg border border-[color:var(--border-subtle)] p-4"
                >
                  <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">
                        {homeTeam} x {awayTeam}
                      </p>
                      <p className="text-sm text-[color:var(--text-muted)]">
                        {match.roundLabel} · {match.venue}
                      </p>
                      <p className="text-xs text-[color:var(--text-muted)]">
                        {formatDateTime(match.kickoffAt)}
                      </p>
                    </div>
                    <Badge variant={result ? "success" : "neutral"}>
                      {result ? "publicado" : "pendente"}
                    </Badge>
                  </div>
                  <OfficialResultForm
                    matchId={match.id}
                    defaults={{
                      homeScore: result?.homeScore,
                      awayScore: result?.awayScore,
                      status: match.status,
                    }}
                  />
                </div>
              );
            })}
          </div>

          {filteredMatches.length === 0 ? (
            <div className="rounded-lg bg-[color:var(--surface-muted)] p-6 text-sm text-[color:var(--text-muted)]">
              Nenhum jogo encontrado.
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
