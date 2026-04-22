import { PhasePredictionsForm } from "@/components/phase-predictions-form";
import {
  getPhaseMatches,
  getPlacementPrediction,
  getSortedPhases,
  getMatchPrediction,
} from "@/lib/domain/selectors";
import { getAppSnapshot, getCurrentUserId } from "@/lib/services/app-service";

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

  return (
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
  );
}
