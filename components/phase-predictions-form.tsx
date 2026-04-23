"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

import { savePhasePredictionsBatch } from "@/app/actions";
import { FormFeedback } from "@/components/forms/form-feedback";
import { SubmitButton } from "@/components/forms/submit-button";
import { TeamFlag } from "@/components/team-flag";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDateTime, formatSectionDate, getDateKeyInAppTimeZone } from "@/lib/formatters";
import type { ActionResult, Match, Phase, PlacementPrediction, PredictionRule, Team } from "@/lib/domain/types";
import { getTeamOrPlaceholder } from "@/lib/domain/selectors";

const initialState: ActionResult = { ok: false, message: "" };

function serializeRelevantFormData(formData: FormData) {
  return Array.from(formData.entries())
    .filter(([name]) => {
      return (
        name.startsWith("homeScore:") ||
        name.startsWith("awayScore:") ||
        name === "championTeamId" ||
        name === "runnerUpTeamId" ||
        name === "thirdPlaceTeamId"
      );
    })
    .map(([name, value]) => [name, String(value).trim()])
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => `${name}=${value}`)
    .join("&");
}

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

function MatchCard({
  match,
  teams,
  defaultHomeScore,
  defaultAwayScore,
  disabled,
}: {
  match: Match;
  teams: Team[];
  defaultHomeScore?: number;
  defaultAwayScore?: number;
  disabled: boolean;
}) {
  const homeTeam = teams.find((team) => team.id === match.homeTeamId);
  const awayTeam = teams.find((team) => team.id === match.awayTeamId);

  return (
    <Card>
      <CardHeader className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
              Rodada
            </div>
            <div className="mt-1 text-sm font-medium text-[color:var(--text-strong)]">
              {match.roundLabel}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
              Data
            </div>
            <div className="mt-1 text-sm font-medium text-[color:var(--text-strong)]">
              {formatDateTime(match.kickoffAt)}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between">
          <div className="flex items-center gap-3">
            <TeamFlag code={homeTeam?.code} />
            <span className="font-semibold text-[color:var(--text-strong)]">
              {getTeamOrPlaceholder(teams, match.homeTeamId, match.homePlaceholder)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-semibold text-[color:var(--text-strong)]">
              {getTeamOrPlaceholder(teams, match.awayTeamId, match.awayPlaceholder)}
            </span>
            <TeamFlag code={awayTeam?.code} />
          </div>
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <Input
            name={`homeScore:${match.id}`}
            type="number"
            min={0}
            max={20}
            defaultValue={defaultHomeScore ?? ""}
            disabled={disabled}
            variant="ghost"
            placeholder="X"
            className="text-center text-lg font-semibold"
          />
          <span className="text-sm text-[color:var(--text-muted)]">x</span>
          <Input
            name={`awayScore:${match.id}`}
            type="number"
            min={0}
            max={20}
            defaultValue={defaultAwayScore ?? ""}
            disabled={disabled}
            variant="ghost"
            placeholder="X"
            className="text-center text-lg font-semibold"
          />
        </div>
      </CardContent>
    </Card>
  );
}

export function PhasePredictionsForm({
  currentUserId,
  competitionId,
  teams,
  phase,
  rule,
  matches,
  defaultScores,
  placementPrediction,
  previousPhaseHref,
  nextPhaseHref,
}: {
  currentUserId: string;
  competitionId: string;
  teams: Team[];
  phase: Phase;
  rule?: PredictionRule;
  matches: Match[];
  defaultScores: Record<string, { homeScore?: number; awayScore?: number }>;
  placementPrediction?: PlacementPrediction;
  previousPhaseHref?: string;
  nextPhaseHref?: string;
}) {
  const [state, formAction] = useActionState(savePhasePredictionsBatch, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const disabled = !rule || rule.status !== "active" || new Date(rule.closesAt) < new Date();
  const isPlacementPhase = Boolean(rule?.enablePlacementPredictions);
  const hasMatchCards = rule?.enableMatchPredictions && matches.length > 0;
  const sections = buildMatchSections(phase, matches);
  const [savedSnapshot, setSavedSnapshot] = useState(() => {
    const matchEntries = matches.flatMap((match) => {
      const values = defaultScores[match.id];
      return [
        [`homeScore:${match.id}`, String(values?.homeScore ?? "").trim()],
        [`awayScore:${match.id}`, String(values?.awayScore ?? "").trim()],
      ];
    });

    const placementEntries = isPlacementPhase
      ? [
          ["championTeamId", String(placementPrediction?.championTeamId ?? "").trim()],
          ["runnerUpTeamId", String(placementPrediction?.runnerUpTeamId ?? "").trim()],
          ["thirdPlaceTeamId", String(placementPrediction?.thirdPlaceTeamId ?? "").trim()],
        ]
      : [];

    return [...matchEntries, ...placementEntries]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, value]) => `${name}=${value}`)
      .join("&");
  });
  const [isDirty, setIsDirty] = useState(false);

  const refreshDirtyState = () => {
    const form = formRef.current;
    if (!form) return;

    const currentSnapshot = serializeRelevantFormData(new FormData(form));
    setIsDirty(currentSnapshot !== savedSnapshot);
  };

  useEffect(() => {
    if (!state.message) return;
    toast[state.ok ? "success" : "error"](state.message);

    if (state.ok && formRef.current) {
      const currentSnapshot = serializeRelevantFormData(new FormData(formRef.current));
      setSavedSnapshot(currentSnapshot);
      setIsDirty(false);
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-4 pb-24"
      onInput={refreshDirtyState}
      onChange={refreshDirtyState}
    >
      <input type="hidden" name="userId" value={currentUserId} />
      <input type="hidden" name="phaseId" value={phase.id} />
      <input type="hidden" name="competitionId" value={competitionId} />

      <Card>
        <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="text-lg font-bold text-[color:var(--text-muted)]">{phase.name}</div>
            <div className="text-sm text-[color:var(--text-muted)]">
              Fecha em {rule ? formatDateTime(rule.closesAt) : "sem regra"}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {previousPhaseHref ? (
              <Button asChild variant="outline" size="sm">
                <Link href={previousPhaseHref}>
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
            {nextPhaseHref ? (
              <Button asChild variant="outline" size="sm">
                <Link href={nextPhaseHref}>
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

      {isPlacementPhase ? (
        <Card>
          <CardHeader>
            <CardTitle>Pódio</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm text-[color:var(--text-muted)]">Campeão</label>
              <Select
                defaultValue={placementPrediction?.championTeamId}
                name="championTeamId"
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-[color:var(--text-muted)]">Vice</label>
              <Select
                defaultValue={placementPrediction?.runnerUpTeamId}
                name="runnerUpTeamId"
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-[color:var(--text-muted)]">Terceiro</label>
              <Select
                defaultValue={placementPrediction?.thirdPlaceTeamId}
                name="thirdPlaceTeamId"
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {hasMatchCards ? (
        <div className="space-y-6">
          {sections.map((section) => (
            <div key={section.id} className="space-y-3">
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
                {section.label}
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                {section.matches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    teams={teams}
                    defaultHomeScore={defaultScores[match.id]?.homeScore}
                    defaultAwayScore={defaultScores[match.id]?.awayScore}
                    disabled={disabled || match.status === "completed"}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {!isPlacementPhase && matches.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-[color:var(--text-muted)]">
            Partidas a serem definidas.
          </CardContent>
        </Card>
      ) : null}

      <FormFeedback state={state} />

      {isDirty && !disabled ? (
        <div className="sticky bottom-4 z-20">
          <div className="ml-auto flex w-full items-center justify-between gap-4 rounded-xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-base)]/95 px-4 py-3 shadow-[var(--shadow-card)] backdrop-blur">
            <div className="text-sm text-[color:var(--text-muted)]">Alterações não salvas</div>
            <SubmitButton pendingLabel="Salvando..." disabled={disabled}>
              Salvar fase
            </SubmitButton>
          </div>
        </div>
      ) : null}
    </form>
  );
}
