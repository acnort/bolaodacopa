"use client";

import Link from "next/link";
import {
  useActionState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

import { savePhasePredictionsBatch } from "@/app/actions";
import { FormFeedback } from "@/components/forms/form-feedback";
import {
  MatchPredictionCountdownBadge,
  PhaseCountdownBadge,
} from "@/components/phase-countdown-badge";
import { SubmitButton } from "@/components/forms/submit-button";
import { TeamFlag } from "@/components/team-flag";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomSelect } from "@/components/ui/custom-select";
import { Input } from "@/components/ui/input";
import {
  formatDateTime,
  formatSectionDate,
  getDateKeyInAppTimeZone,
} from "@/lib/formatters";
import type {
  ActionResult,
  Match,
  Phase,
  PlacementPrediction,
  PredictionRule,
  Team,
} from "@/lib/domain/types";
import { getTeamOrPlaceholder } from "@/lib/domain/selectors";
import {
  getMatchPredictionClosesAt,
  isMatchPredictionOpen,
  isPerMatchPredictionPhase,
} from "@/lib/domain/scoring";

const initialState: ActionResult = { ok: false, message: "" };

function serializeRelevantFormData(
  formData: FormData,
  allowedMatchIds?: Set<string>,
) {
  return Array.from(formData.entries())
    .filter(([name]) => {
      if (allowedMatchIds && name.startsWith("homeScore:")) {
        return allowedMatchIds.has(name.replace("homeScore:", ""));
      }
      if (allowedMatchIds && name.startsWith("awayScore:")) {
        return allowedMatchIds.has(name.replace("awayScore:", ""));
      }

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
  closesAt,
  now,
}: {
  match: Match;
  teams: Team[];
  defaultHomeScore?: number;
  defaultAwayScore?: number;
  disabled: boolean;
  closesAt?: Date;
  now: Date;
}) {
  const homeTeam = teams.find((team) => team.id === match.homeTeamId);
  const awayTeam = teams.find((team) => team.id === match.awayTeamId);

  return (
    <Card>
      <CardHeader className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs tracking-[0.18em] text-[color:var(--text-muted)] uppercase">
              Rodada
            </div>
            <div className="mt-1 text-sm font-medium text-[color:var(--text-strong)]">
              {match.roundLabel}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs tracking-[0.18em] text-[color:var(--text-muted)] uppercase">
              Data
            </div>
            <div className="mt-1 text-sm font-medium text-[color:var(--text-strong)]">
              {formatDateTime(match.kickoffAt)}
            </div>
            {closesAt ? (
              <div className="mt-2 flex justify-end">
                <MatchPredictionCountdownBadge
                  closesAt={closesAt}
                  now={now}
                  compact
                />
              </div>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <TeamFlag code={homeTeam?.code} className="shrink-0" />
            <span className="truncate font-semibold text-[color:var(--text-strong)]">
              {getTeamOrPlaceholder(
                teams,
                match.homeTeamId,
                match.homePlaceholder,
              )}
            </span>
          </div>
          <div className="flex min-w-0 items-center justify-end gap-2">
            <span className="truncate text-right font-semibold text-[color:var(--text-strong)]">
              {getTeamOrPlaceholder(
                teams,
                match.awayTeamId,
                match.awayPlaceholder,
              )}
            </span>
            <TeamFlag code={awayTeam?.code} className="shrink-0" />
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
  const [state, formAction] = useActionState(
    savePhasePredictionsBatch,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const phaseDisabled =
    !rule || rule.status !== "active" || new Date(rule.opensAt) > currentTime;
  const placementDisabled =
    phaseDisabled || !rule || new Date(rule.closesAt) < currentTime;
  const usesPerMatchClose = isPerMatchPredictionPhase(phase.id);
  const getMatchDisabled = useCallback(
    (match: Match) =>
      phaseDisabled ||
      match.status === "completed" ||
      !isMatchPredictionOpen(rule, match, currentTime),
    [currentTime, phaseDisabled, rule],
  );
  const editableMatchIds = useMemo(
    () =>
      new Set(
        matches
          .filter((match) => !getMatchDisabled(match))
          .map((match) => match.id),
      ),
    [getMatchDisabled, matches],
  );
  const editableMatchIdsRef = useRef(editableMatchIds);
  const isPlacementPhase = Boolean(rule?.enablePlacementPredictions);
  const hasMatchCards = rule?.enableMatchPredictions && matches.length > 0;
  const sections = buildMatchSections(phase, matches);
  const teamOptions = teams.map((team) => ({
    value: team.id,
    label: team.name,
    keywords: [team.shortName, team.code],
  }));
  const [savedSnapshot, setSavedSnapshot] = useState(() => {
    const matchEntries = matches.flatMap((match) => {
      if (!editableMatchIds.has(match.id)) return [];

      const values = defaultScores[match.id];
      return [
        [`homeScore:${match.id}`, String(values?.homeScore ?? "").trim()],
        [`awayScore:${match.id}`, String(values?.awayScore ?? "").trim()],
      ];
    });

    const placementEntries = isPlacementPhase
      ? [
          [
            "championTeamId",
            String(placementPrediction?.championTeamId ?? "").trim(),
          ],
          [
            "runnerUpTeamId",
            String(placementPrediction?.runnerUpTeamId ?? "").trim(),
          ],
          [
            "thirdPlaceTeamId",
            String(placementPrediction?.thirdPlaceTeamId ?? "").trim(),
          ],
        ]
      : [];

    return [...matchEntries, ...placementEntries]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, value]) => `${name}=${value}`)
      .join("&");
  });
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const interval = window.setInterval(() => setCurrentTime(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    editableMatchIdsRef.current = editableMatchIds;
  }, [editableMatchIds]);

  const refreshDirtyState = () => {
    const form = formRef.current;
    if (!form) return;

    const currentSnapshot = serializeRelevantFormData(
      new FormData(form),
      editableMatchIds,
    );
    setIsDirty(currentSnapshot !== savedSnapshot);
  };
  const refreshDirtyStateAfterSelect = () => {
    window.setTimeout(refreshDirtyState, 0);
  };

  useEffect(() => {
    if (!state.message) return;
    toast[state.ok ? "success" : "error"](state.message);

    if (state.ok && formRef.current) {
      const currentSnapshot = serializeRelevantFormData(
        new FormData(formRef.current),
        editableMatchIdsRef.current,
      );
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
        <CardContent className="flex flex-col gap-4 p-4 sm:p-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="text-lg font-bold text-[color:var(--text-muted)]">
              {phase.name}
            </div>
            <div className="flex flex-col gap-2 text-sm text-[color:var(--text-muted)] sm:flex-row sm:items-center">
              <span>
                {usesPerMatchClose
                  ? "Fecha 1h antes de cada jogo"
                  : `Fecha em ${
                      rule ? formatDateTime(rule.closesAt) : "sem regra"
                    }`}
              </span>
              <PhaseCountdownBadge
                rule={rule}
                now={currentTime}
                matches={matches}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
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
              <label className="text-sm text-[color:var(--text-muted)]">
                Campeão
              </label>
              <CustomSelect
                defaultValue={placementPrediction?.championTeamId}
                name="championTeamId"
                options={teamOptions}
                placeholder="Selecionar"
                searchPlaceholder="Buscar país"
                emptyMessage="Nenhum país encontrado."
                listLabel="Países"
                disabled={placementDisabled}
                onValueChange={refreshDirtyStateAfterSelect}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-[color:var(--text-muted)]">
                Vice
              </label>
              <CustomSelect
                defaultValue={placementPrediction?.runnerUpTeamId}
                name="runnerUpTeamId"
                options={teamOptions}
                placeholder="Selecionar"
                searchPlaceholder="Buscar país"
                emptyMessage="Nenhum país encontrado."
                listLabel="Países"
                disabled={placementDisabled}
                onValueChange={refreshDirtyStateAfterSelect}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-[color:var(--text-muted)]">
                Terceiro
              </label>
              <CustomSelect
                defaultValue={placementPrediction?.thirdPlaceTeamId}
                name="thirdPlaceTeamId"
                options={teamOptions}
                placeholder="Selecionar"
                searchPlaceholder="Buscar país"
                emptyMessage="Nenhum país encontrado."
                listLabel="Países"
                disabled={placementDisabled}
                align="end"
                onValueChange={refreshDirtyStateAfterSelect}
              />
            </div>
          </CardContent>
        </Card>
      ) : null}

      {hasMatchCards ? (
        <div className="space-y-6">
          {sections.map((section) => (
            <div key={section.id} className="space-y-3">
              <div className="text-sm font-semibold tracking-[0.18em] text-[color:var(--text-muted)] uppercase">
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
                    disabled={getMatchDisabled(match)}
                    closesAt={
                      usesPerMatchClose
                        ? getMatchPredictionClosesAt(match)
                        : undefined
                    }
                    now={currentTime}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {!isPlacementPhase && matches.length === 0 ? (
        <Card>
          <CardContent className="p-4 text-sm text-[color:var(--text-muted)] sm:p-6">
            Partidas a serem definidas.
          </CardContent>
        </Card>
      ) : null}

      <FormFeedback state={state} />

      {isDirty &&
      (isPlacementPhase
        ? !placementDisabled
        : !phaseDisabled && editableMatchIds.size > 0) ? (
        <div className="sticky bottom-4 z-20">
          <div className="ml-auto flex w-full items-center justify-between gap-4 rounded-xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-base)]/95 px-4 py-3 shadow-[var(--shadow-card)] backdrop-blur">
            <div className="text-sm text-[color:var(--text-muted)]">
              Alterações não salvas
            </div>
            <SubmitButton
              pendingLabel="Salvando..."
              disabled={
                isPlacementPhase
                  ? placementDisabled
                  : phaseDisabled || editableMatchIds.size === 0
              }
            >
              Salvar fase
            </SubmitButton>
          </div>
        </div>
      ) : null}
    </form>
  );
}
