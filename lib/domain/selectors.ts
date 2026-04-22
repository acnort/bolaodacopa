import type {
  AppSnapshot,
  Match,
  MatchPrediction,
  Phase,
  PlacementPrediction,
  Team,
} from "@/lib/domain/types";

export function teamMap(teams: Team[]) {
  return new Map(teams.map((team) => [team.id, team]));
}

export function getTeamName(teams: Team[], teamId?: string) {
  if (!teamId) return "-";
  return teams.find((team) => team.id === teamId)?.name ?? "-";
}

export function getTeamOrPlaceholder(
  teams: Team[],
  teamId?: string,
  placeholder?: string,
) {
  if (teamId) {
    return getTeamName(teams, teamId);
  }

  return placeholder ?? "A definir";
}

export function getPhaseMatches(matches: Match[], phaseId: string) {
  return matches
    .filter((match) => match.phaseId === phaseId)
    .sort(
      (a, b) =>
        new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime(),
    );
}

export function getSortedPhases(phases: Phase[]) {
  return [...phases].sort((a, b) => a.order - b.order);
}

export function getMatchPrediction(
  predictions: MatchPrediction[],
  userId: string,
  matchId: string,
) {
  return predictions.find(
    (prediction) =>
      prediction.userId === userId && prediction.matchId === matchId,
  );
}

export function getPlacementPrediction(
  predictions: PlacementPrediction[],
  userId: string,
  competitionId: string,
) {
  return predictions.find(
    (prediction) =>
      prediction.userId === userId &&
      prediction.competitionId === competitionId,
  );
}

export function getSnapshotSummary(snapshot: AppSnapshot) {
  return {
    members: snapshot.memberships.length,
    openInvites: snapshot.invites.filter((invite) => invite.status === "pending")
      .length,
    completedMatches: snapshot.results.length,
    totalMatches: snapshot.matches.length,
  };
}
