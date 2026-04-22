import type { AppSnapshot, MatchPrediction, PlacementPrediction, Team } from "@/lib/domain/types";

export function teamMap(teams: Team[]) {
  return new Map(teams.map((team) => [team.id, team]));
}

export function getTeamName(teams: Team[], teamId?: string) {
  if (!teamId) return "-";
  return teams.find((team) => team.id === teamId)?.name ?? "-";
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
