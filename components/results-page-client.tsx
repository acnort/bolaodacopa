"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { MatchPredictionCountdownBadge } from "@/components/phase-countdown-badge";
import {
  PhaseProgressSidebar,
  type PhaseProgressItem,
} from "@/components/phase-progress-sidebar";
import { TeamFlag } from "@/components/team-flag";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getPhaseMatches,
  getSortedPhases,
  getTeamOrPlaceholder,
} from "@/lib/domain/selectors";
import type { AppSnapshot, Match, Phase } from "@/lib/domain/types";
import {
  getMatchPredictionClosesAt,
  isPerMatchPredictionPhase,
} from "@/lib/domain/scoring";
import {
  formatDateTime,
  formatSectionDate,
  getDateKeyInAppTimeZone,
} from "@/lib/formatters";
import { useSandboxSnapshot } from "@/lib/sandbox-storage";

function buildMatchSections(phase: Phase, matches: Match[]) {
  if (phase.id === "phase-groups") {
    const groups = new Map<string, Match[]>();

    for (const match of matches) {
      const key = match.stageGroup ?? "Grupo";
      const current = groups.get(key) ?? [];
      current.push(match);
      groups.set(key, current);
    }

    return [...groups.entries()].map(([label, sectionMatches]) => ({
      id: label,
      label,
      matches: sectionMatches,
    }));
  }

  const byDate = new Map<string, Match[]>();
  for (const match of matches) {
    const key = getDateKeyInAppTimeZone(match.kickoffAt);
    const current = byDate.get(key) ?? [];
    current.push(match);
    byDate.set(key, current);
  }

  return [...byDate.entries()].map(([key, sectionMatches]) => ({
    id: key,
    label: formatSectionDate(sectionMatches[0]?.kickoffAt ?? key),
    matches: sectionMatches,
  }));
}

function buildPhaseProgressItems({
  phases,
  snapshot,
  selectedPhaseId,
}: {
  phases: Phase[];
  snapshot: AppSnapshot;
  selectedPhaseId: string;
}): PhaseProgressItem[] {
  return phases.map((phase) => {
    const phaseRule = snapshot.rules.find((rule) => rule.phaseId === phase.id);

    if (phase.id === "phase-podium") {
      const publishedCount = [
        snapshot.placementResult.championTeamId,
        snapshot.placementResult.runnerUpTeamId,
        snapshot.placementResult.thirdPlaceTeamId,
      ].filter(Boolean).length;
      const totalCount = 3;

      return {
        phaseId: phase.id,
        phaseName: phase.name,
        href: `/app/resultados?phase=${phase.slug}`,
        savedCount: publishedCount,
        totalCount,
        status:
          publishedCount === 0
            ? "empty"
            : publishedCount === totalCount
              ? "complete"
              : "partial",
        isSelected: phase.id === selectedPhaseId,
        rule: phaseRule,
      };
    }

    const phaseMatches = snapshot.matches.filter(
      (match) => match.phaseId === phase.id,
    );
    const phaseMatchIds = new Set(phaseMatches.map((match) => match.id));
    const publishedCount = snapshot.results.filter((result) =>
      phaseMatchIds.has(result.matchId),
    ).length;
    const totalCount = phaseMatches.length;

    return {
      phaseId: phase.id,
      phaseName: phase.name,
      href: `/app/resultados?phase=${phase.slug}`,
      savedCount: publishedCount,
      totalCount,
      status:
        publishedCount === 0
          ? "empty"
          : publishedCount === totalCount
            ? "complete"
            : "partial",
      isSelected: phase.id === selectedPhaseId,
      rule: phaseRule,
      matches: phaseMatches,
    };
  });
}

function ResultCard({
  match,
  snapshot,
  currentTime,
}: {
  match: Match;
  snapshot: AppSnapshot;
  currentTime: Date;
}) {
  const result = snapshot.results.find((item) => item.matchId === match.id);
  const homeTeam = snapshot.teams.find((team) => team.id === match.homeTeamId);
  const awayTeam = snapshot.teams.find((team) => team.id === match.awayTeamId);
  const closesAt = isPerMatchPredictionPhase(match.phaseId)
    ? getMatchPredictionClosesAt(match)
    : undefined;

  return (
    <Card>
      <CardHeader className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs tracking-[0.18em] text-[color:var(--text-muted)] uppercase">
              {match.roundLabel}
            </div>
            <div className="mt-1 text-sm font-medium text-[color:var(--text-strong)]">
              {formatDateTime(match.kickoffAt)}
            </div>
            {closesAt ? (
              <div className="mt-2">
                <MatchPredictionCountdownBadge
                  closesAt={closesAt}
                  now={currentTime}
                  compact
                />
              </div>
            ) : null}
          </div>
          <Badge variant={result ? "success" : "neutral"}>
            {result ? "publicado" : "pendente"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <TeamFlag code={homeTeam?.code} />
            <span className="truncate font-semibold text-[color:var(--text-strong)]">
              {getTeamOrPlaceholder(
                snapshot.teams,
                match.homeTeamId,
                match.homePlaceholder,
              )}
            </span>
          </div>

          <div className="rounded-lg bg-[color:var(--surface-muted)] px-3 py-2 text-base font-bold text-[color:var(--text-strong)] sm:px-4 sm:text-lg">
            {result ? `${result.homeScore} x ${result.awayScore}` : "- x -"}
          </div>

          <div className="flex min-w-0 items-center justify-end gap-3">
            <span className="truncate text-right font-semibold text-[color:var(--text-strong)]">
              {getTeamOrPlaceholder(
                snapshot.teams,
                match.awayTeamId,
                match.awayPlaceholder,
              )}
            </span>
            <TeamFlag code={awayTeam?.code} />
          </div>
        </div>

        <div className="text-sm text-[color:var(--text-muted)]">
          {match.venue || "Estádio a definir"}
          {result?.publishedAt
            ? ` · publicado em ${formatDateTime(result.publishedAt)}`
            : ""}
        </div>
      </CardContent>
    </Card>
  );
}

function PodiumResults({ snapshot }: { snapshot: AppSnapshot }) {
  const podium = [
    { label: "Campeão", teamId: snapshot.placementResult.championTeamId },
    { label: "Vice", teamId: snapshot.placementResult.runnerUpTeamId },
    { label: "Terceiro", teamId: snapshot.placementResult.thirdPlaceTeamId },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pódio oficial</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-3">
        {podium.map((item) => {
          const team = snapshot.teams.find(
            (candidate) => candidate.id === item.teamId,
          );

          return (
            <div
              key={item.label}
              className="rounded-lg border border-[color:var(--border-subtle)] p-4"
            >
              <div className="text-xs tracking-[0.18em] text-[color:var(--text-muted)] uppercase">
                {item.label}
              </div>
              <div className="mt-3 flex items-center gap-3 font-semibold text-[color:var(--text-strong)]">
                <TeamFlag code={team?.code} />
                <span>{team?.name ?? "A definir"}</span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export function ResultsPageClient({
  snapshot,
  phaseSlug,
}: {
  snapshot: AppSnapshot;
  phaseSlug?: string;
}) {
  const sandboxSnapshot = useSandboxSnapshot();
  const activeSnapshot = sandboxSnapshot ?? snapshot;
  const isSandbox = Boolean(sandboxSnapshot);
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const phases = getSortedPhases(activeSnapshot.phases);
  const selectedPhase =
    phases.find((phase) => phase.slug === phaseSlug) ?? phases[0];
  const phaseIndex = phases.findIndex((phase) => phase.id === selectedPhase.id);
  const matches = getPhaseMatches(activeSnapshot.matches, selectedPhase.id);
  const sections = buildMatchSections(selectedPhase, matches);
  const previousPhase = phaseIndex > 0 ? phases[phaseIndex - 1] : undefined;
  const nextPhase =
    phaseIndex < phases.length - 1 ? phases[phaseIndex + 1] : undefined;
  const phaseProgressItems = buildPhaseProgressItems({
    phases,
    snapshot: activeSnapshot,
    selectedPhaseId: selectedPhase.id,
  });

  useEffect(() => {
    const interval = window.setInterval(() => setCurrentTime(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4">
      {isSandbox ? (
        <Badge variant="accent">
          Sandbox ativo: resultados locais simulados
        </Badge>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:gap-12">
        <div className="space-y-4 pb-8">
          <Card>
            <CardContent className="flex flex-col gap-4 p-4 sm:p-6 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <div className="text-lg font-bold text-[color:var(--text-muted)]">
                  {selectedPhase.name}
                </div>
                <div className="text-sm text-[color:var(--text-muted)]">
                  Resultados oficiais das partidas
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {previousPhase ? (
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/app/resultados?phase=${previousPhase.slug}`}>
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" disabled>
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                )}
                {nextPhase ? (
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/app/resultados?phase=${nextPhase.slug}`}>
                      Próxima
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" disabled>
                    Próxima
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {selectedPhase.id === "phase-podium" ? (
            <PodiumResults snapshot={activeSnapshot} />
          ) : matches.length > 0 ? (
            <div className="space-y-6">
              {sections.map((section) => (
                <div key={section.id} className="space-y-3">
                  <div className="text-sm font-semibold tracking-[0.18em] text-[color:var(--text-muted)] uppercase">
                    {section.label}
                  </div>
                  <div className="grid gap-4 lg:grid-cols-2">
                    {section.matches.map((match) => (
                      <ResultCard
                        key={match.id}
                        match={match}
                        snapshot={activeSnapshot}
                        currentTime={currentTime}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-4 text-sm text-[color:var(--text-muted)] sm:p-6">
                Partidas a serem definidas.
              </CardContent>
            </Card>
          )}
        </div>

        <div className="xl:sticky xl:top-4 xl:self-start">
          <PhaseProgressSidebar
            items={phaseProgressItems}
            countLabel="publicados"
          />
        </div>
      </div>
    </div>
  );
}
