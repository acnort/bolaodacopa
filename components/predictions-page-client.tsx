"use client";

import { PhasePredictionsForm } from "@/components/phase-predictions-form";
import {
  PhaseProgressSidebar,
  type PhaseProgressItem,
} from "@/components/phase-progress-sidebar";
import { Badge } from "@/components/ui/badge";
import {
  getCurrentPhase,
  getMatchPrediction,
  getPhaseMatches,
  getPlacementPrediction,
  getSortedPhases,
} from "@/lib/domain/selectors";
import type { AppSnapshot } from "@/lib/domain/types";
import { useSandboxSnapshot } from "@/lib/sandbox-storage";

function buildPhaseProgressItems({
  phases,
  matches,
  currentUserId,
  matchPredictions,
  placementPrediction,
  rules,
  selectedPhaseId,
}: {
  phases: ReturnType<typeof getSortedPhases>;
  matches: AppSnapshot["matches"];
  currentUserId: string;
  matchPredictions: AppSnapshot["matchPredictions"];
  placementPrediction: ReturnType<typeof getPlacementPrediction>;
  rules: AppSnapshot["rules"];
  selectedPhaseId: string;
}): PhaseProgressItem[] {
  return phases.map((phase) => {
    const phaseRule = rules.find((rule) => rule.phaseId === phase.id);

    if (phase.id === "phase-podium") {
      const savedCount = [
        placementPrediction?.championTeamId,
        placementPrediction?.runnerUpTeamId,
        placementPrediction?.thirdPlaceTeamId,
      ].filter(Boolean).length;
      const totalCount = 3;

      return {
        phaseId: phase.id,
        phaseName: phase.name,
        href: `/app/palpites?phase=${phase.slug}`,
        savedCount,
        totalCount,
        status:
          savedCount === 0
            ? "empty"
            : savedCount === totalCount
              ? "complete"
              : "partial",
        isSelected: phase.id === selectedPhaseId,
        rule: phaseRule,
      };
    }

    const phaseMatches = matches.filter((match) => match.phaseId === phase.id);
    const phaseMatchIds = new Set(phaseMatches.map((match) => match.id));
    const savedCount = matchPredictions.filter(
      (prediction) =>
        prediction.userId === currentUserId &&
        phaseMatchIds.has(prediction.matchId),
    ).length;
    const totalCount = phaseMatches.length;

    return {
      phaseId: phase.id,
      phaseName: phase.name,
      href: `/app/palpites?phase=${phase.slug}`,
      savedCount,
      totalCount,
      status:
        savedCount === 0
          ? "empty"
          : savedCount === totalCount
            ? "complete"
            : "partial",
      isSelected: phase.id === selectedPhaseId,
      rule: phaseRule,
      matches: phaseMatches,
    };
  });
}

export function PredictionsPageClient({
  snapshot,
  currentUserId,
  phaseSlug,
  visibleAt,
}: {
  snapshot: AppSnapshot;
  currentUserId: string;
  phaseSlug?: string;
  visibleAt: string;
}) {
  const sandboxSnapshot = useSandboxSnapshot();
  const activeSnapshot = sandboxSnapshot ?? snapshot;
  const isSandbox = Boolean(sandboxSnapshot);
  const phases = getSortedPhases(activeSnapshot.phases);
  const selectedPhase =
    phases.find((phase) => phase.slug === phaseSlug) ??
    getCurrentPhase(phases, new Date(visibleAt)) ??
    phases[0];
  const phaseIndex = phases.findIndex((phase) => phase.id === selectedPhase.id);
  const rule = activeSnapshot.rules.find(
    (item) => item.phaseId === selectedPhase.id,
  );
  const matches = getPhaseMatches(activeSnapshot.matches, selectedPhase.id);
  const defaultScores = Object.fromEntries(
    matches.map((match) => {
      const prediction = getMatchPrediction(
        activeSnapshot.matchPredictions,
        currentUserId,
        match.id,
      );

      return [
        match.id,
        {
          homeScore: prediction?.homeScore,
          awayScore: prediction?.awayScore,
        },
      ];
    }),
  );
  const previousPhase = phaseIndex > 0 ? phases[phaseIndex - 1] : undefined;
  const nextPhase =
    phaseIndex < phases.length - 1 ? phases[phaseIndex + 1] : undefined;
  const placementPrediction = getPlacementPrediction(
    activeSnapshot.placementPredictions,
    currentUserId,
    activeSnapshot.competition.id,
  );
  const phaseProgressItems = buildPhaseProgressItems({
    phases,
    matches: activeSnapshot.matches,
    currentUserId,
    matchPredictions: activeSnapshot.matchPredictions,
    placementPrediction,
    rules: activeSnapshot.rules,
    selectedPhaseId: selectedPhase.id,
  });

  return (
    <div className="space-y-4">
      {isSandbox ? (
        <Badge variant="accent">Sandbox ativo: dados locais simulados</Badge>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:gap-12">
        <PhasePredictionsForm
          key={`${isSandbox ? "sandbox" : "real"}-${selectedPhase.id}-${activeSnapshot.matchPredictions.length}`}
          currentUserId={currentUserId}
          competitionId={activeSnapshot.competition.id}
          teams={activeSnapshot.teams}
          phase={selectedPhase}
          rule={rule}
          matches={matches}
          defaultScores={defaultScores}
          placementPrediction={placementPrediction}
          previousPhaseHref={
            previousPhase
              ? `/app/palpites?phase=${previousPhase.slug}`
              : undefined
          }
          nextPhaseHref={
            nextPhase ? `/app/palpites?phase=${nextPhase.slug}` : undefined
          }
        />
        <div className="xl:sticky xl:top-4 xl:self-start">
          <PhaseProgressSidebar items={phaseProgressItems} />
        </div>
      </div>
    </div>
  );
}
