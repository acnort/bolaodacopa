import "server-only";

import { unstable_noStore as noStore } from "next/cache";

import { buildLeaderboard, buildScoreEntries, isRuleOpen } from "@/lib/domain/scoring";
import type { ActionResult, AppSnapshot } from "@/lib/domain/types";
import {
  acceptInviteDemo,
  createInviteDemo,
  getDemoCurrentUser,
  getDemoSnapshot,
  saveMatchPredictionDemo,
  saveOfficialResultDemo,
  savePhaseRuleDemo,
  savePlacementPredictionDemo,
  savePlacementResultDemo,
} from "@/lib/services/demo-store";
import { isApiFootballConfigured } from "@/lib/services/api-football-config";
import { getResultsProvider } from "@/lib/services/results-provider-factory";

export async function getAppSnapshot() {
  noStore();
  return getDemoSnapshot();
}

export async function getCurrentUserId() {
  return getDemoCurrentUser();
}

export async function getCurrentUser(snapshot?: AppSnapshot) {
  const data = snapshot ?? (await getAppSnapshot());
  const userId = await getCurrentUserId();
  return data.profiles.find((profile) => profile.id === userId) ?? data.profiles[0];
}

export async function getDashboardData() {
  const snapshot = await getAppSnapshot();
  const currentUserId = await getCurrentUserId();
  const resultsProvider = getResultsProvider();
  const leaderboard = buildLeaderboard(snapshot);
  const currentUser = snapshot.profiles.find((profile) => profile.id === currentUserId);
  const upcomingMatches = snapshot.matches
    .filter((match) => match.status === "scheduled")
    .sort(
      (a, b) =>
        new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime(),
    )
    .slice(0, 4);

  return {
    snapshot,
    leaderboard,
    scoreEntries: buildScoreEntries(snapshot),
    currentUser,
    currentStanding: leaderboard.find((entry) => entry.userId === currentUserId),
    upcomingMatches,
    providerStatus: await resultsProvider.syncCompetitionData(),
    isDemoMode: !isApiFootballConfigured(),
  };
}

export async function saveMatchPredictionAction(
  formData: FormData,
): Promise<ActionResult<{ updatedId: string }>> {
  return saveMatchPredictionDemo({
    userId: String(formData.get("userId") ?? ""),
    matchId: String(formData.get("matchId") ?? ""),
    homeScore: Number(formData.get("homeScore") ?? 0),
    awayScore: Number(formData.get("awayScore") ?? 0),
  });
}

export async function savePlacementPredictionAction(
  formData: FormData,
): Promise<ActionResult<{ updatedId: string }>> {
  return savePlacementPredictionDemo({
    userId: String(formData.get("userId") ?? ""),
    competitionId: String(formData.get("competitionId") ?? ""),
    championTeamId: String(formData.get("championTeamId") ?? ""),
    runnerUpTeamId: String(formData.get("runnerUpTeamId") ?? ""),
    thirdPlaceTeamId: String(formData.get("thirdPlaceTeamId") ?? ""),
  });
}

export async function createInviteAction(
  formData: FormData,
): Promise<ActionResult<{ token: string }>> {
  return createInviteDemo({
    email: String(formData.get("email") ?? ""),
    role: (String(formData.get("role") ?? "member") as "admin" | "member"),
    expiresAt: String(formData.get("expiresAt") ?? ""),
  });
}

export async function acceptInviteAction(
  formData: FormData,
): Promise<ActionResult<{ userId: string }>> {
  return acceptInviteDemo({
    token: String(formData.get("token") ?? ""),
    fullName: String(formData.get("fullName") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
}

export async function saveOfficialResultAction(
  formData: FormData,
): Promise<ActionResult<{ updatedId: string }>> {
  return saveOfficialResultDemo({
    matchId: String(formData.get("matchId") ?? ""),
    homeScore: Number(formData.get("homeScore") ?? 0),
    awayScore: Number(formData.get("awayScore") ?? 0),
    status: String(formData.get("status") ?? "completed") as
      | "scheduled"
      | "in_progress"
      | "completed",
  });
}

export async function savePlacementResultAction(
  formData: FormData,
): Promise<ActionResult<{ updatedId: string }>> {
  return savePlacementResultDemo({
    competitionId: String(formData.get("competitionId") ?? ""),
    championTeamId: String(formData.get("championTeamId") ?? ""),
    runnerUpTeamId: String(formData.get("runnerUpTeamId") ?? ""),
    thirdPlaceTeamId: String(formData.get("thirdPlaceTeamId") ?? ""),
  });
}

export async function savePhaseRuleAction(
  formData: FormData,
): Promise<ActionResult<{ updatedId: string }>> {
  return savePhaseRuleDemo({
    phaseId: String(formData.get("phaseId") ?? ""),
    enableMatchPredictions: formData.get("enableMatchPredictions") === "on",
    enablePlacementPredictions:
      formData.get("enablePlacementPredictions") === "on",
    opensAt: String(formData.get("opensAt") ?? ""),
    closesAt: String(formData.get("closesAt") ?? ""),
    exactScore: Number(formData.get("exactScore") ?? 0),
    correctOutcome: Number(formData.get("correctOutcome") ?? 0),
    champion: Number(formData.get("champion") ?? 0),
    runnerUp: Number(formData.get("runnerUp") ?? 0),
    thirdPlace: Number(formData.get("thirdPlace") ?? 0),
    status: String(formData.get("status") ?? "draft") as
      | "draft"
      | "active"
      | "locked",
  });
}

export async function getPhaseRuleStatus(phaseId: string) {
  const snapshot = await getAppSnapshot();
  const rule = snapshot.rules.find((item) => item.phaseId === phaseId);
  return rule ? isRuleOpen(rule) : false;
}
