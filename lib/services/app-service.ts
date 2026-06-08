import "server-only";

import { unstable_noStore as noStore } from "next/cache";
import { cookies } from "next/headers";

import {
  buildLeaderboard,
  buildScoreEntries,
  isRuleOpen,
} from "@/lib/domain/scoring";
import type {
  ActionResult,
  AppSnapshot,
  Match,
  PhaseBatchPredictionInput,
  PhaseRuleInput,
  Profile,
  SyncedMatchInput,
  UserRole,
} from "@/lib/domain/types";
import {
  isDatabaseConfigured,
  requireDatabaseInProduction,
} from "@/lib/services/database/shared";
import {
  activateSignupRequestDemo,
  clearOfficialResultsDemo,
  createAccessInviteDemo,
  createSignupRequestDemo,
  getProviderSyncStateDemo,
  getPasswordHashByEmailDemo,
  getDemoSnapshot,
  removeMemberDemo,
  removeSignupRequestDemo,
  reviewSignupRequestDemo,
  updateMemberRoleDemo,
  savePhasePredictionsDemo,
  saveMatchPredictionDemo,
  saveOfficialResultDemo,
  savePhaseRuleDemo,
  savePlacementPredictionDemo,
  savePlacementResultDemo,
  saveProviderSyncStateDemo,
  syncMatchesDemo,
} from "@/lib/services/demo-store";
import {
  activateAccessInvitePostgres,
  clearOfficialResultsPostgres,
  createAccessInvitePostgres,
  createSignupRequestPostgres,
  getProviderSyncStatePostgres,
  getPasswordHashByEmailPostgres,
  getPostgresSnapshot,
  removeMemberPostgres,
  removeSignupRequestPostgres,
  reviewSignupRequestPostgres,
  updateMemberRolePostgres,
  saveMatchPredictionPostgres,
  saveOfficialResultPostgres,
  savePhasePredictionsPostgres,
  savePhaseRulePostgres,
  savePlacementPredictionPostgres,
  savePlacementResultPostgres,
  saveProviderSyncStatePostgres,
  syncMatchesPostgres,
} from "@/lib/services/postgres-store";
import type {
  ResultsSyncOptions,
  ResultsSyncSummary,
} from "@/lib/services/results-provider";
import {
  getResultsProvider,
  getResultsProviderName,
} from "@/lib/services/results-provider-factory";
import { hashPassword, verifyPassword } from "@/lib/services/passwords";
import {
  createSessionToken,
  SESSION_TTL_SECONDS,
  verifySessionToken,
} from "@/lib/services/session-token";

const AUTH_COOKIE_NAME = "bolao-user-id";
const PROVIDER_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const PROVIDER_RATE_LIMIT_MAX_CALLS = 8;
const LIVE_SYNC_INTERVAL_SECONDS = 60;
const MATCHDAY_SYNC_INTERVAL_SECONDS = 5 * 60;
const BACKGROUND_SYNC_INTERVAL_SECONDS = 6 * 60 * 60;

let providerCallTimestamps: number[] = [];

function isDevelopmentSessionSecretFallbackEnabled() {
  return process.env.NODE_ENV !== "production";
}

function getSessionSecret() {
  const secret = process.env.AUTH_SECRET?.trim();
  if (secret) return secret;

  return isDevelopmentSessionSecretFallbackEnabled()
    ? "bolaov2-local-development-secret"
    : undefined;
}

function hasApprovedMembership(snapshot: AppSnapshot, userId: string) {
  return snapshot.memberships.some(
    (membership) => membership.userId === userId,
  );
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
  if (!hasApprovedMembership(data, session.userId)) {
    return undefined;
  }

  return data.profiles.find((profile) => profile.id === session.userId);
}

async function getActionProfile(
  snapshot?: AppSnapshot,
): Promise<Profile | undefined> {
  const data = snapshot ?? (await getAppSnapshot());
  const sessionProfile = await getSessionProfile(data);
  return sessionProfile;
}

async function requireActionProfile(snapshot?: AppSnapshot) {
  const profile = await getActionProfile(snapshot);
  if (profile) return profile;

  return undefined;
}

async function requireAdminProfile(snapshot?: AppSnapshot) {
  const profile = await requireActionProfile(snapshot);
  return profile?.role === "admin" || profile?.role === "owner"
    ? profile
    : undefined;
}

async function requireOwnerProfile(snapshot?: AppSnapshot) {
  const profile = await requireActionProfile(snapshot);
  return profile?.role === "owner" ? profile : undefined;
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

function ownerOnlyResult<T = unknown>(): ActionResult<T> {
  return {
    ok: false,
    message: "Apenas owners podem executar esta ação.",
  };
}

export async function getAppSnapshot() {
  noStore();
  requireDatabaseInProduction();
  return isDatabaseConfigured() ? getPostgresSnapshot() : getDemoSnapshot();
}

export async function getCurrentUserId(snapshot?: AppSnapshot) {
  const sessionProfile = await getSessionProfile(snapshot);
  if (sessionProfile) return sessionProfile.id;

  return "";
}

export async function getCurrentUser(snapshot?: AppSnapshot) {
  const data = snapshot ?? (await getAppSnapshot());
  const userId = await getCurrentUserId(data);
  return data.profiles.find((profile) => profile.id === userId);
}

export async function hasAccessSession() {
  const sessionProfile = await getSessionProfile();
  return Boolean(sessionProfile);
}

export async function getDashboardData() {
  const snapshot = await getAppSnapshot();
  const currentUserId = await getCurrentUserId(snapshot);
  const providerName = getResultsProviderName();
  const leaderboard = buildLeaderboard(snapshot);
  const currentUser = snapshot.profiles.find(
    (profile) => profile.id === currentUserId,
  );
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
    currentStanding: leaderboard.find(
      (entry) => entry.userId === currentUserId,
    ),
    upcomingMatches,
    providerStatus: {
      syncedAt: new Date().toISOString(),
      matches: snapshot.matches.length,
      results: snapshot.results.length,
      provider: providerName,
      mode: "daily" as const,
      fallbackAdminManual: true,
    },
    isDemoMode: !isDatabaseConfigured(),
    isResultsApiConfigured:
      providerName !== "mock" && providerName !== "unconfigured",
  };
}

function findMatchingInternalMatch(
  externalMatch: Match,
  internalMatches: Match[],
  usedMatchIds: Set<string>,
) {
  const externalMatchId = externalMatch.externalMatchId ?? externalMatch.id;
  const byExternalId = internalMatches.find(
    (match) =>
      !usedMatchIds.has(match.id) &&
      (match.externalMatchId === externalMatchId ||
        match.id === externalMatchId),
  );

  if (byExternalId) return byExternalId;

  if (!externalMatch.homeTeamId || !externalMatch.awayTeamId) {
    return undefined;
  }

  return internalMatches.find(
    (match) =>
      !usedMatchIds.has(match.id) &&
      match.phaseId === externalMatch.phaseId &&
      match.homeTeamId === externalMatch.homeTeamId &&
      match.awayTeamId === externalMatch.awayTeamId,
  );
}

function getProviderSyncStateKey(providerName: string) {
  return `results:${providerName}`;
}

async function getProviderSyncState(key: string) {
  return isDatabaseConfigured()
    ? getProviderSyncStatePostgres(key)
    : getProviderSyncStateDemo(key);
}

async function saveProviderSyncState(key: string, syncedAt: string) {
  if (isDatabaseConfigured()) {
    await saveProviderSyncStatePostgres(key, syncedAt);
    return;
  }

  saveProviderSyncStateDemo(key, syncedAt);
}

function isSameLocalDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function getAdaptiveSyncCadence(snapshot: AppSnapshot, now = new Date()) {
  const liveWindowStartMs = now.getTime() + 15 * 60 * 1000;
  const liveWindowEndMs = now.getTime() - 3 * 60 * 60 * 1000;
  const hasLiveWindowMatch = snapshot.matches.some((match) => {
    if (match.status === "in_progress") return true;

    const kickoffTime = new Date(match.kickoffAt).getTime();
    return kickoffTime <= liveWindowStartMs && kickoffTime >= liveWindowEndMs;
  });

  if (hasLiveWindowMatch) {
    return {
      mode: "live-window" as const,
      intervalSeconds: LIVE_SYNC_INTERVAL_SECONDS,
    };
  }

  const hasMatchToday = snapshot.matches.some((match) =>
    isSameLocalDay(new Date(match.kickoffAt), now),
  );

  if (hasMatchToday) {
    return {
      mode: "daily" as const,
      intervalSeconds: MATCHDAY_SYNC_INTERVAL_SECONDS,
    };
  }

  return {
    mode: "daily" as const,
    intervalSeconds: BACKGROUND_SYNC_INTERVAL_SECONDS,
  };
}

function getNextRecommendedSyncAt(from: Date, intervalSeconds: number) {
  return new Date(from.getTime() + intervalSeconds * 1000).toISOString();
}

function canUseProviderCallBudget(externalCalls: number) {
  const now = Date.now();
  providerCallTimestamps = providerCallTimestamps.filter(
    (timestamp) => now - timestamp < PROVIDER_RATE_LIMIT_WINDOW_MS,
  );

  return (
    providerCallTimestamps.length + externalCalls <=
    PROVIDER_RATE_LIMIT_MAX_CALLS
  );
}

function recordProviderCalls(externalCalls: number) {
  const now = Date.now();
  providerCallTimestamps.push(
    ...Array.from({ length: externalCalls }, () => now),
  );
}

async function fetchProviderMatchData(
  provider: ReturnType<typeof getResultsProvider>,
  options?: ResultsSyncOptions,
) {
  if (provider.getMatchData) {
    return provider.getMatchData(options);
  }

  const [matches, results] = await Promise.all([
    provider.listMatches(options),
    provider.getResults(options),
  ]);

  return { matches, results, externalCalls: 2 };
}

export async function syncResultsProviderAction(
  options?: ResultsSyncOptions,
): Promise<ActionResult<ResultsSyncSummary>> {
  const providerName = getResultsProviderName();
  if (providerName === "mock" || providerName === "unconfigured") {
    return {
      ok: false,
      message: "API de resultados não configurada.",
    };
  }

  const requestedMode = options?.mode ?? "daily";
  const snapshot = await getAppSnapshot();
  const now = new Date();
  const cadence =
    requestedMode === "adaptive"
      ? getAdaptiveSyncCadence(snapshot, now)
      : {
          mode: requestedMode,
          intervalSeconds:
            requestedMode === "live-window"
              ? LIVE_SYNC_INTERVAL_SECONDS
              : BACKGROUND_SYNC_INTERVAL_SECONDS,
        };
  const syncStateKey = getProviderSyncStateKey(providerName);
  const lastSyncedAt = await getProviderSyncState(syncStateKey);

  if (requestedMode === "adaptive" && lastSyncedAt && !options?.force) {
    const elapsedMs = now.getTime() - new Date(lastSyncedAt).getTime();
    const minIntervalMs = cadence.intervalSeconds * 1000;

    if (elapsedMs >= 0 && elapsedMs < minIntervalMs) {
      return {
        ok: true,
        message: "Sync ignorado pela cadência adaptativa.",
        data: {
          syncedAt: lastSyncedAt,
          matches: snapshot.matches.length,
          results: snapshot.results.length,
          provider: providerName,
          mode: requestedMode,
          date: options?.date,
          fallbackAdminManual: true,
          externalCalls: 0,
          skipped: true,
          skipReason: "adaptive-cadence",
          recommendedIntervalSeconds: cadence.intervalSeconds,
          nextRecommendedSyncAt: getNextRecommendedSyncAt(
            new Date(lastSyncedAt),
            cadence.intervalSeconds,
          ),
        },
      };
    }
  }

  if (!canUseProviderCallBudget(1)) {
    return {
      ok: true,
      message: "Sync ignorado para preservar o limite da API.",
      data: {
        syncedAt: lastSyncedAt ?? now.toISOString(),
        matches: snapshot.matches.length,
        results: snapshot.results.length,
        provider: providerName,
        mode: requestedMode,
        date: options?.date,
        fallbackAdminManual: true,
        externalCalls: 0,
        skipped: true,
        skipReason: "rate-limit-budget",
        recommendedIntervalSeconds: cadence.intervalSeconds,
        nextRecommendedSyncAt: getNextRecommendedSyncAt(
          lastSyncedAt ? new Date(lastSyncedAt) : now,
          cadence.intervalSeconds,
        ),
      },
    };
  }

  const provider = getResultsProvider();
  const providerData = await fetchProviderMatchData(provider, {
    ...options,
    mode: cadence.mode,
  });
  recordProviderCalls(providerData.externalCalls);
  const providerMatches = providerData.matches;
  const providerResults = providerData.results;
  const resultsByExternalId = new Map(
    providerResults.map((result) => [result.matchId, result]),
  );
  const usedMatchIds = new Set<string>();
  const syncedInputs: SyncedMatchInput[] = [];
  let unmatchedMatches = 0;

  for (const externalMatch of providerMatches) {
    const internalMatch = findMatchingInternalMatch(
      externalMatch,
      snapshot.matches,
      usedMatchIds,
    );
    const externalMatchId = externalMatch.externalMatchId ?? externalMatch.id;

    if (!internalMatch) {
      unmatchedMatches += 1;
      continue;
    }

    usedMatchIds.add(internalMatch.id);
    const result = resultsByExternalId.get(externalMatchId);

    syncedInputs.push({
      matchId: internalMatch.id,
      externalMatchId,
      kickoffAt: externalMatch.kickoffAt,
      status: externalMatch.status,
      homeScore: result?.homeScore,
      awayScore: result?.awayScore,
    });
  }

  const persisted = isDatabaseConfigured()
    ? await syncMatchesPostgres(syncedInputs)
    : syncMatchesDemo(syncedInputs);

  if (!persisted.ok) {
    return { ok: false, message: persisted.message };
  }

  const syncedAt = new Date().toISOString();
  await saveProviderSyncState(syncStateKey, syncedAt);

  return {
    ok: true,
    message: "Resultados sincronizados.",
    data: {
      syncedAt,
      matches: providerMatches.length,
      results: providerResults.length,
      provider: providerName,
      mode: requestedMode,
      date: options?.date,
      fallbackAdminManual: true,
      persistedMatches: persisted.data?.updatedMatches ?? 0,
      persistedResults: persisted.data?.updatedResults ?? 0,
      unmatchedMatches,
      externalCalls: providerData.externalCalls,
      skipped: false,
      recommendedIntervalSeconds: cadence.intervalSeconds,
      nextRecommendedSyncAt: getNextRecommendedSyncAt(
        new Date(syncedAt),
        cadence.intervalSeconds,
      ),
    },
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
        return {
          ok: false,
          message: "Existe um palpite fora da fase selecionada.",
        };
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

export async function setupAccessAction(
  formData: FormData,
): Promise<ActionResult<{ redirectTo: string }>> {
  const token = String(formData.get("token") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const passwordHash = await hashPassword(password);

  const result = isDatabaseConfigured()
    ? await activateAccessInvitePostgres({
        token,
        fullName,
        email,
        passwordHash,
      })
    : activateSignupRequestDemo({
        token,
        fullName,
        email,
        passwordHash,
      });

  if (!result.ok || !result.data) {
    return { ok: false, message: result.message };
  }

  if (result.data.requiresApproval) {
    return {
      ok: true,
      message: result.message,
      data: { redirectTo: "/entrar" },
    };
  }

  const secret = getSessionSecret();
  if (!secret) {
    return { ok: false, message: "AUTH_SECRET não configurado." };
  }

  const cookieStore = await cookies();
  const { token: sessionToken, expiresAt } = createSessionToken(
    result.data.userId,
    secret,
  );
  cookieStore.set(AUTH_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
    maxAge: SESSION_TTL_SECONDS,
  });

  return {
    ok: true,
    message: "Acesso ativado.",
    data: { redirectTo: "/app" },
  };
}

export async function createAccessInviteAction(): Promise<
  ActionResult<{ token: string }>
> {
  const admin = await requireAdminProfile();
  if (!admin) return forbiddenResult();

  return isDatabaseConfigured()
    ? createAccessInvitePostgres(admin.id)
    : createAccessInviteDemo(admin.id);
}

export async function reviewSignupRequestAction(
  formData: FormData,
): Promise<ActionResult<{ userId: string }>> {
  const admin = await requireAdminProfile();
  if (!admin) return forbiddenResult();

  if (isDatabaseConfigured()) {
    return reviewSignupRequestPostgres({
      requestId: String(formData.get("requestId") ?? ""),
      action: String(formData.get("action") ?? "approve") as
        | "approve"
        | "reject",
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

export async function clearOfficialResultsAction(): Promise<
  ActionResult<{ resetResults: number; resetPlacement: boolean }>
> {
  const admin = await requireAdminProfile();
  if (!admin) return forbiddenResult();

  return isDatabaseConfigured()
    ? clearOfficialResultsPostgres()
    : clearOfficialResultsDemo();
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
      return {
        ok: false,
        message: result.message,
        fieldErrors: result.fieldErrors,
      };
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

export async function updateMemberRoleAction(
  formData: FormData,
): Promise<ActionResult<{ updatedId: string; role: UserRole }>> {
  const owner = await requireOwnerProfile();
  if (!owner) return ownerOnlyResult();

  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "") as UserRole;

  return isDatabaseConfigured()
    ? updateMemberRolePostgres(userId, role)
    : updateMemberRoleDemo(userId, role);
}

export async function getPhaseRuleStatus(phaseId: string) {
  const snapshot = await getAppSnapshot();
  const rule = snapshot.rules.find((item) => item.phaseId === phaseId);
  return rule ? isRuleOpen(rule) : false;
}

export async function signInAction(
  formData: FormData,
): Promise<ActionResult<{ redirectTo: string }>> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { ok: false, message: "Informe email e senha." };
  }

  const snapshot = await getAppSnapshot();
  const profile = snapshot.profiles.find(
    (item) => item.email.trim().toLowerCase() === email,
  );

  if (!profile) {
    return { ok: false, message: "Email ou senha inválidos." };
  }

  if (!hasApprovedMembership(snapshot, profile.id)) {
    return {
      ok: false,
      message: "Seu cadastro ainda está aguardando aprovação.",
    };
  }

  const passwordHash = isDatabaseConfigured()
    ? await getPasswordHashByEmailPostgres(email)
    : getPasswordHashByEmailDemo(email);

  if (!passwordHash) {
    return {
      ok: false,
      message: "Defina sua senha usando o link de acesso antes de entrar.",
    };
  }

  const isPasswordValid = await verifyPassword(password, passwordHash);
  if (!isPasswordValid) {
    return { ok: false, message: "Email ou senha inválidos." };
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

export async function signOutAction(): Promise<
  ActionResult<{ redirectTo: string }>
> {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);

  return {
    ok: true,
    message: "Sessão encerrada.",
    data: { redirectTo: "/entrar" },
  };
}
