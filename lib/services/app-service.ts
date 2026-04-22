import "server-only";

import { unstable_noStore as noStore } from "next/cache";

import { buildLeaderboard, buildScoreEntries, isRuleOpen } from "@/lib/domain/scoring";
import type { ActionResult, AppSnapshot, PhaseBatchPredictionInput } from "@/lib/domain/types";
import { isDatabaseConfigured } from "@/lib/services/database/shared";
import {
  acceptInviteDemo,
  createInviteDemo,
  getDemoCurrentUser,
  getDemoSnapshot,
  savePhasePredictionsDemo,
  saveMatchPredictionDemo,
  saveOfficialResultDemo,
  savePhaseRuleDemo,
  savePlacementPredictionDemo,
  savePlacementResultDemo,
} from "@/lib/services/demo-store";
import { isApiFootballConfigured } from "@/lib/services/api-football-config";
import {
  acceptInvitePostgres,
  createInvitePostgres,
  getPostgresCurrentUser,
  getPostgresSnapshot,
  saveMatchPredictionPostgres,
  saveOfficialResultPostgres,
  savePhasePredictionsPostgres,
  savePhaseRulePostgres,
  savePlacementPredictionPostgres,
  savePlacementResultPostgres,
} from "@/lib/services/postgres-store";
import { getResultsProvider } from "@/lib/services/results-provider-factory";

export async function getAppSnapshot() {
  noStore();
  return isDatabaseConfigured() ? getPostgresSnapshot() : getDemoSnapshot();
}

export async function getCurrentUserId() {
  return isDatabaseConfigured()
    ? getPostgresCurrentUser()
    : getDemoCurrentUser();
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
    isDemoMode: !isDatabaseConfigured(),
    isResultsApiConfigured: isApiFootballConfigured(),
  };
}

export async function saveMatchPredictionAction(
  formData: FormData,
): Promise<ActionResult<{ updatedId: string }>> {
  const snapshot = await getAppSnapshot();
  const matchId = String(formData.get("matchId") ?? "");
  const match = snapshot.matches.find((item) => item.id === matchId);
  const rule = match
    ? snapshot.rules.find((item) => item.phaseId === match.phaseId)
    : undefined;

  if (!match || !rule || !rule.enableMatchPredictions || !isRuleOpen(rule)) {
    return { ok: false, message: "A fase está fechada para edição." };
  }

  if (isDatabaseConfigured()) {
    return saveMatchPredictionPostgres({
      userId: String(formData.get("userId") ?? ""),
      matchId,
      homeScore: Number(formData.get("homeScore") ?? 0),
      awayScore: Number(formData.get("awayScore") ?? 0),
    });
  }

  return saveMatchPredictionDemo({
    userId: String(formData.get("userId") ?? ""),
    matchId,
    homeScore: Number(formData.get("homeScore") ?? 0),
    awayScore: Number(formData.get("awayScore") ?? 0),
  });
}

export async function savePlacementPredictionAction(
  formData: FormData,
): Promise<ActionResult<{ updatedId: string }>> {
  const snapshot = await getAppSnapshot();
  const competitionId = String(formData.get("competitionId") ?? "");
  const rule = snapshot.rules.find((item) => item.enablePlacementPredictions);

  if (
    !rule ||
    !rule.enablePlacementPredictions ||
    competitionId !== snapshot.competition.id ||
    !isRuleOpen(rule)
  ) {
    return { ok: false, message: "A fase está fechada para edição." };
  }

  if (isDatabaseConfigured()) {
    return savePlacementPredictionPostgres({
      userId: String(formData.get("userId") ?? ""),
      competitionId,
      championTeamId: String(formData.get("championTeamId") ?? ""),
      runnerUpTeamId: String(formData.get("runnerUpTeamId") ?? ""),
      thirdPlaceTeamId: String(formData.get("thirdPlaceTeamId") ?? ""),
    });
  }

  return savePlacementPredictionDemo({
    userId: String(formData.get("userId") ?? ""),
    competitionId,
    championTeamId: String(formData.get("championTeamId") ?? ""),
    runnerUpTeamId: String(formData.get("runnerUpTeamId") ?? ""),
    thirdPlaceTeamId: String(formData.get("thirdPlaceTeamId") ?? ""),
  });
}

export async function savePhasePredictionsBatchAction(
  input: PhaseBatchPredictionInput,
): Promise<ActionResult<{ updatedCount: number }>> {
  const snapshot = await getAppSnapshot();
  const rule = snapshot.rules.find((item) => item.phaseId === input.phaseId);

  if (!rule || !isRuleOpen(rule)) {
    return { ok: false, message: "A fase está fechada para edição." };
  }

  if (rule.enableMatchPredictions) {
    const phaseMatchIds = new Set(
      snapshot.matches
        .filter((match) => match.phaseId === input.phaseId)
        .map((match) => match.id),
    );

    for (const prediction of input.predictions) {
      if (!phaseMatchIds.has(prediction.matchId)) {
        return { ok: false, message: "Existe um palpite fora da fase selecionada." };
      }
    }
  }

  if (rule.enablePlacementPredictions && input.placementPrediction) {
    if (
      input.placementPrediction.championTeamId ===
        input.placementPrediction.runnerUpTeamId ||
      input.placementPrediction.championTeamId ===
        input.placementPrediction.thirdPlaceTeamId ||
      input.placementPrediction.runnerUpTeamId ===
        input.placementPrediction.thirdPlaceTeamId
    ) {
      return {
        ok: false,
        message: "Campeão, vice e terceiro precisam ser diferentes.",
      };
    }
  }

  return isDatabaseConfigured()
    ? savePhasePredictionsPostgres(input)
    : savePhasePredictionsDemo(input);
}

export async function createInviteAction(
  formData: FormData,
): Promise<ActionResult<{ token: string }>> {
  if (isDatabaseConfigured()) {
    return createInvitePostgres({
      email: String(formData.get("email") ?? ""),
      role: (String(formData.get("role") ?? "member") as "admin" | "member"),
      expiresAt: String(formData.get("expiresAt") ?? ""),
    });
  }

  return createInviteDemo({
    email: String(formData.get("email") ?? ""),
    role: (String(formData.get("role") ?? "member") as "admin" | "member"),
    expiresAt: String(formData.get("expiresAt") ?? ""),
  });
}

export async function acceptInviteAction(
  formData: FormData,
): Promise<ActionResult<{ userId: string }>> {
  if (isDatabaseConfigured()) {
    return acceptInvitePostgres({
      token: String(formData.get("token") ?? ""),
      fullName: String(formData.get("fullName") ?? ""),
      password: String(formData.get("password") ?? ""),
    });
  }

  return acceptInviteDemo({
    token: String(formData.get("token") ?? ""),
    fullName: String(formData.get("fullName") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
}

export async function saveOfficialResultAction(
  formData: FormData,
): Promise<ActionResult<{ updatedId: string }>> {
  if (isDatabaseConfigured()) {
    return saveOfficialResultPostgres({
      matchId: String(formData.get("matchId") ?? ""),
      homeScore: Number(formData.get("homeScore") ?? 0),
      awayScore: Number(formData.get("awayScore") ?? 0),
      status: String(formData.get("status") ?? "completed") as
        | "scheduled"
        | "in_progress"
        | "completed",
    });
  }

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
  if (isDatabaseConfigured()) {
    return savePlacementResultPostgres({
      competitionId: String(formData.get("competitionId") ?? ""),
      championTeamId: String(formData.get("championTeamId") ?? ""),
      runnerUpTeamId: String(formData.get("runnerUpTeamId") ?? ""),
      thirdPlaceTeamId: String(formData.get("thirdPlaceTeamId") ?? ""),
    });
  }

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
  if (isDatabaseConfigured()) {
    return savePhaseRulePostgres({
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
