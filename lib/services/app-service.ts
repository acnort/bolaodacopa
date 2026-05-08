import "server-only";

import { unstable_noStore as noStore } from "next/cache";
import { cookies } from "next/headers";

import { buildLeaderboard, buildScoreEntries, isRuleOpen } from "@/lib/domain/scoring";
import type { ActionResult, AppSnapshot, PhaseBatchPredictionInput, PhaseRuleInput, Profile } from "@/lib/domain/types";
import { isDatabaseConfigured } from "@/lib/services/database/shared";
import {
  createSignupRequestDemo,
  getDemoCurrentUser,
  getDemoSnapshot,
  removeMemberDemo,
  removeSignupRequestDemo,
  reviewSignupRequestDemo,
  savePhasePredictionsDemo,
  saveMatchPredictionDemo,
  saveOfficialResultDemo,
  savePhaseRuleDemo,
  savePlacementPredictionDemo,
  savePlacementResultDemo,
} from "@/lib/services/demo-store";
import { isApiFootballConfigured } from "@/lib/services/api-football-config";
import {
  createSignupRequestPostgres,
  getPostgresCurrentUser,
  getPostgresSnapshot,
  removeMemberPostgres,
  removeSignupRequestPostgres,
  reviewSignupRequestPostgres,
  saveMatchPredictionPostgres,
  saveOfficialResultPostgres,
  savePhasePredictionsPostgres,
  savePhaseRulePostgres,
  savePlacementPredictionPostgres,
  savePlacementResultPostgres,
} from "@/lib/services/postgres-store";
import { getResultsProvider } from "@/lib/services/results-provider-factory";
import {
  createSessionToken,
  SESSION_TTL_SECONDS,
  verifySessionToken,
} from "@/lib/services/session-token";

const AUTH_COOKIE_NAME = "bolao-user-id";

function isDevelopmentAuthFallbackEnabled() {
  return process.env.NODE_ENV !== "production";
}

function getSessionSecret() {
  const secret = process.env.AUTH_SECRET?.trim();
  if (secret) return secret;

  return isDevelopmentAuthFallbackEnabled()
    ? "bolaov2-local-development-secret"
    : undefined;
}

async function getSessionProfile(snapshot?: AppSnapshot) {
  const secret = getSessionSecret();
  if (!secret) return undefined;

  const cookieStore = await cookies();
  const session = verifySessionToken(
    cookieStore.get(AUTH_COOKIE_NAME)?.value,
    secret,
  );

  if (!session) return undefined;

  const data = snapshot ?? (await getAppSnapshot());
  return data.profiles.find((profile) => profile.id === session.userId);
}

async function getDevelopmentCurrentUserId() {
  if (!isDevelopmentAuthFallbackEnabled()) return undefined;

  return isDatabaseConfigured()
    ? getPostgresCurrentUser()
    : getDemoCurrentUser();
}

async function getActionProfile(snapshot?: AppSnapshot): Promise<Profile | undefined> {
  const data = snapshot ?? (await getAppSnapshot());
  const sessionProfile = await getSessionProfile(data);
  if (sessionProfile) return sessionProfile;

  const developmentUserId = await getDevelopmentCurrentUserId();
  if (!developmentUserId) return undefined;

  return data.profiles.find((profile) => profile.id === developmentUserId);
}

async function requireActionProfile(snapshot?: AppSnapshot) {
  const profile = await getActionProfile(snapshot);
  if (profile) return profile;

  return undefined;
}

async function requireAdminProfile(snapshot?: AppSnapshot) {
  const profile = await requireActionProfile(snapshot);
  return profile?.role === "admin" ? profile : undefined;
}

function unauthorizedResult<T = unknown>(): ActionResult<T> {
  return {
    ok: false,
    message: "Entre com um email aprovado para continuar.",
  };
}

function forbiddenResult<T = unknown>(): ActionResult<T> {
  return {
    ok: false,
    message: "Apenas administradores podem executar esta ação.",
  };
}

export async function getAppSnapshot() {
  noStore();
  return isDatabaseConfigured() ? getPostgresSnapshot() : getDemoSnapshot();
}

export async function getCurrentUserId(snapshot?: AppSnapshot) {
  const sessionProfile = await getSessionProfile(snapshot);
  if (sessionProfile) return sessionProfile.id;

  return (await getDevelopmentCurrentUserId()) ?? "";
}

export async function getCurrentUser(snapshot?: AppSnapshot) {
  const data = snapshot ?? (await getAppSnapshot());
  const userId = await getCurrentUserId(data);
  return data.profiles.find((profile) => profile.id === userId) ?? data.profiles[0];
}

export async function hasAccessSession() {
  const sessionProfile = await getSessionProfile();
  if (sessionProfile) return true;

  return Boolean(await getDevelopmentCurrentUserId());
}

export async function getDashboardData() {
  const snapshot = await getAppSnapshot();
  const currentUserId = await getCurrentUserId(snapshot);
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
  const currentUser = await requireActionProfile(snapshot);

  if (!currentUser) {
    return unauthorizedResult();
  }

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
      userId: currentUser.id,
      matchId,
      homeScore: Number(formData.get("homeScore") ?? 0),
      awayScore: Number(formData.get("awayScore") ?? 0),
    });
  }

  return saveMatchPredictionDemo({
    userId: currentUser.id,
    matchId,
    homeScore: Number(formData.get("homeScore") ?? 0),
    awayScore: Number(formData.get("awayScore") ?? 0),
  });
}

export async function savePlacementPredictionAction(
  formData: FormData,
): Promise<ActionResult<{ updatedId: string }>> {
  const snapshot = await getAppSnapshot();
  const currentUser = await requireActionProfile(snapshot);

  if (!currentUser) {
    return unauthorizedResult();
  }

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
      userId: currentUser.id,
      competitionId,
      championTeamId: String(formData.get("championTeamId") ?? ""),
      runnerUpTeamId: String(formData.get("runnerUpTeamId") ?? ""),
      thirdPlaceTeamId: String(formData.get("thirdPlaceTeamId") ?? ""),
    });
  }

  return savePlacementPredictionDemo({
    userId: currentUser.id,
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
  const currentUser = await requireActionProfile(snapshot);

  if (!currentUser) {
    return unauthorizedResult();
  }

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
    ? savePhasePredictionsPostgres({ ...input, userId: currentUser.id })
    : savePhasePredictionsDemo({ ...input, userId: currentUser.id });
}

export async function createSignupRequestAction(
  formData: FormData,
): Promise<ActionResult<{ token: string }>> {
  if (isDatabaseConfigured()) {
    return createSignupRequestPostgres({
      fullName: String(formData.get("fullName") ?? ""),
      email: String(formData.get("email") ?? ""),
    });
  }

  return createSignupRequestDemo({
    fullName: String(formData.get("fullName") ?? ""),
    email: String(formData.get("email") ?? ""),
  });
}

export async function reviewSignupRequestAction(
  formData: FormData,
): Promise<ActionResult<{ userId: string }>> {
  const admin = await requireAdminProfile();
  if (!admin) return forbiddenResult();

  if (isDatabaseConfigured()) {
    return reviewSignupRequestPostgres({
      requestId: String(formData.get("requestId") ?? ""),
      action: String(formData.get("action") ?? "approve") as "approve" | "reject",
      reviewedByUserId: admin.id,
    });
  }

  return reviewSignupRequestDemo({
    requestId: String(formData.get("requestId") ?? ""),
    action: String(formData.get("action") ?? "approve") as "approve" | "reject",
    reviewedByUserId: admin.id,
  });
}

export async function saveOfficialResultAction(
  formData: FormData,
): Promise<ActionResult<{ updatedId: string }>> {
  const admin = await requireAdminProfile();
  if (!admin) return forbiddenResult();

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
  const admin = await requireAdminProfile();
  if (!admin) return forbiddenResult();

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
  const admin = await requireAdminProfile();
  if (!admin) return forbiddenResult();

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

export async function savePhaseRulesBatchAction(
  rules: PhaseRuleInput[],
): Promise<ActionResult<{ updatedCount: number }>> {
  const admin = await requireAdminProfile();
  if (!admin) return forbiddenResult();

  let updatedCount = 0;

  for (const rule of rules) {
    const result = isDatabaseConfigured()
      ? await savePhaseRulePostgres(rule)
      : savePhaseRuleDemo(rule);

    if (!result.ok) {
      return { ok: false, message: result.message, fieldErrors: result.fieldErrors };
    }

    updatedCount += 1;
  }

  return {
    ok: true,
    message: "Regras salvas.",
    data: { updatedCount },
  };
}

export async function removeSignupRequestAction(
  formData: FormData,
): Promise<ActionResult<{ removedId: string }>> {
  const admin = await requireAdminProfile();
  if (!admin) return forbiddenResult();

  const requestId = String(formData.get("requestId") ?? "");

  return isDatabaseConfigured()
    ? removeSignupRequestPostgres(requestId)
    : removeSignupRequestDemo(requestId);
}

export async function removeMemberAction(
  formData: FormData,
): Promise<ActionResult<{ removedId: string }>> {
  const admin = await requireAdminProfile();
  if (!admin) return forbiddenResult();

  const userId = String(formData.get("userId") ?? "");

  return isDatabaseConfigured()
    ? removeMemberPostgres(userId, admin.id)
    : removeMemberDemo(userId, admin.id);
}

export async function getPhaseRuleStatus(phaseId: string) {
  const snapshot = await getAppSnapshot();
  const rule = snapshot.rules.find((item) => item.phaseId === phaseId);
  return rule ? isRuleOpen(rule) : false;
}

export async function signInAction(
  formData: FormData,
): Promise<ActionResult<{ redirectTo: string }>> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email) {
    return { ok: false, message: "Informe um email válido." };
  }

  const snapshot = await getAppSnapshot();
  const profile = snapshot.profiles.find(
    (item) => item.email.trim().toLowerCase() === email,
  );

  if (!profile) {
    const request = snapshot.signupRequests.find(
      (item) => item.email.trim().toLowerCase() === email,
    );

    if (request) {
      return {
        ok: false,
        message:
          request.status === "pending"
            ? "Seu cadastro ainda está aguardando aprovação."
            : "Seu cadastro foi recusado por um admin.",
      };
    }

    return { ok: false, message: "Nenhum acesso liberado para este email." };
  }

  const cookieStore = await cookies();
  const secret = getSessionSecret();

  if (!secret) {
    return { ok: false, message: "AUTH_SECRET não configurado." };
  }

  const { token, expiresAt } = createSessionToken(profile.id, secret);
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
    maxAge: SESSION_TTL_SECONDS,
  });

  return {
    ok: true,
    message: "Acesso liberado.",
    data: { redirectTo: "/app" },
  };
}

export async function signOutAction(): Promise<ActionResult<{ redirectTo: string }>> {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);

  return {
    ok: true,
    message: "Sessão encerrada.",
    data: { redirectTo: "/entrar" },
  };
}
