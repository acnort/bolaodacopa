import { PhaseProgressSidebar, type PhaseProgressItem } from "@/components/phase-progress-sidebar";
import { PhasePredictionsForm } from "@/components/phase-predictions-form";
import {
  getPhaseMatches,
  getPlacementPrediction,
  getSortedPhases,
  getMatchPrediction,
} from "@/lib/domain/selectors";
import { getAppSnapshot, getCurrentUserId } from "@/lib/services/app-service";

function buildPhaseProgressItems({
  phases,
  matches,
  currentUserId,
  matchPredictions,
  placementPrediction,
  selectedPhaseId,
}: {
  phases: Awaited<ReturnType<typeof getSortedPhases>>;
  matches: Awaited<ReturnType<typeof getAppSnapshot>>["matches"];
  currentUserId: string;
  matchPredictions: Awaited<ReturnType<typeof getAppSnapshot>>["matchPredictions"];
  placementPrediction: Awaited<ReturnType<typeof getPlacementPrediction>>;
  selectedPhaseId: string;
}): PhaseProgressItem[] {
  return phases.map((phase) => {
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
    };
  });
}

export default async function PredictionsPage({
  searchParams,
}: {
  searchParams: Promise<{ phase?: string }>;
}) {
  const snapshot = await getAppSnapshot();
  const currentUserId = await getCurrentUserId();
  const { phase: phaseSlug } = await searchParams;

  const phases = getSortedPhases(snapshot.phases);
  const selectedPhase =
    phases.find((phase) => phase.slug === phaseSlug) ?? phases[0];
  const phaseIndex = phases.findIndex((phase) => phase.id === selectedPhase.id);
  const rule = snapshot.rules.find((item) => item.phaseId === selectedPhase.id);
  const matches = getPhaseMatches(snapshot.matches, selectedPhase.id);
  const defaultScores = Object.fromEntries(
    matches.map((match) => {
      const prediction = getMatchPrediction(
        snapshot.matchPredictions,
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
  const nextPhase = phaseIndex < phases.length - 1 ? phases[phaseIndex + 1] : undefined;
  const placementPrediction = getPlacementPrediction(
    snapshot.placementPredictions,
    currentUserId,
    snapshot.competition.id,
  );
  const phaseProgressItems = buildPhaseProgressItems({
    phases,
    matches: snapshot.matches,
    currentUserId,
    matchPredictions: snapshot.matchPredictions,
    placementPrediction,
    selectedPhaseId: selectedPhase.id,
  });

  return (
    <div className="grid gap-12 xl:grid-cols-[minmax(0,1fr)_320px]">
      <PhasePredictionsForm
        currentUserId={currentUserId}
        competitionId={snapshot.competition.id}
        teams={snapshot.teams}
        phase={selectedPhase}
        rule={rule}
        matches={matches}
        defaultScores={defaultScores}
        placementPrediction={placementPrediction}
        previousPhaseHref={
          previousPhase ? `/app/palpites?phase=${previousPhase.slug}` : undefined
        }
        nextPhaseHref={nextPhase ? `/app/palpites?phase=${nextPhase.slug}` : undefined}
      />
      <div className="xl:sticky xl:top-4 xl:self-start">
        <PhaseProgressSidebar items={phaseProgressItems} />
      </div>
    </div>
  );
}
