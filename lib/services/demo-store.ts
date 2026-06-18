import "server-only";

import { demoCurrentUserId, sampleSnapshot } from "@/lib/data/sample-data";
import {
  type AccessSetupInput,
  type AccessSetupResult,
  type ActionResult,
  type AppSnapshot,
  type MatchPredictionInput,
  type MatchStatus,
  type OfficialResultInput,
  type PhaseBatchPredictionInput,
  type PhaseRuleInput,
  type PlacementPredictionInput,
  type PlacementResultInput,
  type ProfileUpdateInput,
  type SignupRequestInput,
  type SignupRequestReviewInput,
  type SyncedMatchInput,
  type UserRole,
} from "@/lib/domain/types";

const state = {
  snapshot: structuredClone(sampleSnapshot) as AppSnapshot,
  syncState: new Map<string, string>(),
  passwordHashes: new Map<string, string>(),
};

function nowIso() {
  return new Date().toISOString();
}

function nextId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function mergeSyncedMatchStatus({
  currentStatus,
  inputStatus,
  hasScore,
}: {
  currentStatus: MatchStatus;
  inputStatus: MatchStatus;
  hasScore: boolean;
}) {
  if (currentStatus === "completed") return "completed";
  if (inputStatus === "completed") return "completed";
  if (inputStatus === "in_progress") return "in_progress";
  if (hasScore) return "in_progress";
  if (currentStatus === "in_progress") return "in_progress";
  return inputStatus;
}

export function getDemoSnapshot() {
  return structuredClone(state.snapshot);
}

export function getDemoCurrentUser() {
  return demoCurrentUserId;
}

export function resetDemoStore() {
  state.snapshot = structuredClone(sampleSnapshot);
  state.syncState.clear();
  state.passwordHashes.clear();
}

export function saveMatchPredictionDemo(
  input: MatchPredictionInput,
): ActionResult<{ updatedId: string }> {
  const existing = state.snapshot.matchPredictions.find(
    (item) => item.userId === input.userId && item.matchId === input.matchId,
  );

  if (existing) {
    existing.homeScore = input.homeScore;
    existing.awayScore = input.awayScore;
    existing.updatedAt = nowIso();
    return {
      ok: true,
      message: "Palpite de jogo atualizado.",
      data: { updatedId: existing.id },
    };
  }

  const id = nextId("pred");
  state.snapshot.matchPredictions.push({
    id,
    userId: input.userId,
    matchId: input.matchId,
    homeScore: input.homeScore,
    awayScore: input.awayScore,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  });

  return {
    ok: true,
    message: "Palpite de jogo salvo.",
    data: { updatedId: id },
  };
}

export function savePhasePredictionsDemo(
  input: PhaseBatchPredictionInput,
): ActionResult<{ updatedCount: number }> {
  let updatedCount = 0;

  for (const prediction of input.predictions) {
    const result = saveMatchPredictionDemo({
      userId: input.userId,
      matchId: prediction.matchId,
      homeScore: prediction.homeScore,
      awayScore: prediction.awayScore,
    });

    if (!result.ok) {
      return { ok: false, message: result.message };
    }

    updatedCount += 1;
  }

  if (input.placementPrediction) {
    const result = savePlacementPredictionDemo({
      userId: input.userId,
      competitionId: input.placementPrediction.competitionId,
      championTeamId: input.placementPrediction.championTeamId,
      runnerUpTeamId: input.placementPrediction.runnerUpTeamId,
      thirdPlaceTeamId: input.placementPrediction.thirdPlaceTeamId,
    });

    if (!result.ok) {
      return { ok: false, message: result.message };
    }

    updatedCount += 1;
  }

  return {
    ok: true,
    message:
      updatedCount > 0
        ? "Palpites da fase salvos."
        : "Nenhuma alteração enviada.",
    data: { updatedCount },
  };
}

export function savePlacementPredictionDemo(
  input: PlacementPredictionInput,
): ActionResult<{ updatedId: string }> {
  const existing = state.snapshot.placementPredictions.find(
    (item) =>
      item.userId === input.userId &&
      item.competitionId === input.competitionId,
  );

  if (existing) {
    existing.championTeamId = input.championTeamId;
    existing.runnerUpTeamId = input.runnerUpTeamId;
    existing.thirdPlaceTeamId = input.thirdPlaceTeamId;
    existing.updatedAt = nowIso();
    return {
      ok: true,
      message: "Palpite final atualizado.",
      data: { updatedId: existing.id },
    };
  }

  const id = nextId("placement");
  state.snapshot.placementPredictions.push({
    id,
    userId: input.userId,
    competitionId: input.competitionId,
    championTeamId: input.championTeamId,
    runnerUpTeamId: input.runnerUpTeamId,
    thirdPlaceTeamId: input.thirdPlaceTeamId,
    updatedAt: nowIso(),
  });

  return { ok: true, message: "Palpite final salvo.", data: { updatedId: id } };
}

export function saveOfficialResultDemo(
  input: OfficialResultInput,
): ActionResult<{ updatedId: string }> {
  const match = state.snapshot.matches.find(
    (item) => item.id === input.matchId,
  );
  if (!match) {
    return { ok: false, message: "Partida nao encontrada." };
  }

  match.status = input.status;

  const existing = state.snapshot.results.find(
    (item) => item.matchId === input.matchId,
  );
  if (existing) {
    existing.homeScore = input.homeScore;
    existing.awayScore = input.awayScore;
    existing.publishedAt = nowIso();
    existing.isManual = true;
    return {
      ok: true,
      message: "Resultado oficial atualizado.",
      data: { updatedId: existing.matchId },
    };
  }

  state.snapshot.results.push({
    matchId: input.matchId,
    homeScore: input.homeScore,
    awayScore: input.awayScore,
    publishedAt: nowIso(),
    isManual: true,
  });

  return {
    ok: true,
    message: "Resultado oficial salvo.",
    data: { updatedId: input.matchId },
  };
}

export function clearOfficialResultsDemo(): ActionResult<{
  resetResults: number;
  resetPlacement: boolean;
}> {
  const resetResults = state.snapshot.results.length;
  const resetPlacement = Boolean(state.snapshot.placementResult.publishedAt);

  state.snapshot.results = [];
  state.snapshot.matches = state.snapshot.matches.map((match) =>
    match.status === "scheduled" ? match : { ...match, status: "scheduled" },
  );
  state.snapshot.placementResult = {
    competitionId: state.snapshot.competition.id,
  };

  return {
    ok: true,
    message: "Resultados resetados.",
    data: { resetResults, resetPlacement },
  };
}

export function syncMatchesDemo(
  inputs: SyncedMatchInput[],
): ActionResult<{ updatedMatches: number; updatedResults: number }> {
  let updatedMatches = 0;
  let updatedResults = 0;

  for (const input of inputs) {
    const match = state.snapshot.matches.find(
      (item) => item.id === input.matchId,
    );
    if (!match) continue;

    const shouldSwapScores =
      input.homeTeamId !== undefined &&
      input.awayTeamId !== undefined &&
      match.homeTeamId === input.awayTeamId &&
      match.awayTeamId === input.homeTeamId;

    match.externalMatchId = input.externalMatchId;
    match.kickoffAt = input.kickoffAt;
    match.homeTeamId = input.homeTeamId ?? match.homeTeamId;
    match.awayTeamId = input.awayTeamId ?? match.awayTeamId;
    match.status = mergeSyncedMatchStatus({
      currentStatus: match.status,
      inputStatus: input.status,
      hasScore: input.homeScore !== undefined && input.awayScore !== undefined,
    });
    updatedMatches += 1;

    if (shouldSwapScores) {
      for (const prediction of state.snapshot.matchPredictions.filter(
        (item) => item.matchId === input.matchId,
      )) {
        const homeScore = prediction.homeScore;
        prediction.homeScore = prediction.awayScore;
        prediction.awayScore = homeScore;
        prediction.updatedAt = nowIso();
      }

      const existingResult = state.snapshot.results.find(
        (item) => item.matchId === input.matchId,
      );
      if (existingResult && !existingResult.isManual) {
        const homeScore = existingResult.homeScore;
        existingResult.homeScore = existingResult.awayScore;
        existingResult.awayScore = homeScore;
        existingResult.publishedAt = nowIso();
      }
    }

    if (input.homeScore === undefined || input.awayScore === undefined) {
      continue;
    }

    const existing = state.snapshot.results.find(
      (item) => item.matchId === input.matchId,
    );

    if (existing) {
      if (existing.isManual) {
        continue;
      }

      existing.homeScore = input.homeScore;
      existing.awayScore = input.awayScore;
      existing.publishedAt = nowIso();
    } else {
      state.snapshot.results.push({
        matchId: input.matchId,
        homeScore: input.homeScore,
        awayScore: input.awayScore,
        publishedAt: nowIso(),
        isManual: false,
      });
    }

    updatedResults += 1;
  }

  return {
    ok: true,
    message: "Resultados sincronizados.",
    data: { updatedMatches, updatedResults },
  };
}

export function getProviderSyncStateDemo(key: string) {
  return state.syncState.get(key);
}

export function saveProviderSyncStateDemo(key: string, syncedAt = nowIso()) {
  state.syncState.set(key, syncedAt);
}

export function savePlacementResultDemo(
  input: PlacementResultInput,
): ActionResult<{ updatedId: string }> {
  state.snapshot.placementResult = {
    competitionId: input.competitionId,
    championTeamId: input.championTeamId,
    runnerUpTeamId: input.runnerUpTeamId,
    thirdPlaceTeamId: input.thirdPlaceTeamId,
    publishedAt: nowIso(),
  };

  return {
    ok: true,
    message: "Resultado do podio atualizado.",
    data: { updatedId: input.competitionId },
  };
}

export function savePhaseRuleDemo(
  input: PhaseRuleInput,
): ActionResult<{ updatedId: string }> {
  const existing = state.snapshot.rules.find(
    (item) => item.phaseId === input.phaseId,
  );
  if (!existing) {
    return { ok: false, message: "Regra da fase nao encontrada." };
  }

  existing.enableMatchPredictions = input.enableMatchPredictions;
  existing.enablePlacementPredictions = input.enablePlacementPredictions;
  existing.opensAt = input.opensAt;
  existing.closesAt = input.closesAt;
  existing.scoring = {
    exactScore: input.exactScore,
    correctOutcome: input.correctOutcome,
    champion: input.champion,
    runnerUp: input.runnerUp,
    thirdPlace: input.thirdPlace,
  };
  existing.status = input.status;

  return {
    ok: true,
    message: "Regra da fase atualizada.",
    data: { updatedId: existing.id },
  };
}

export function removeSignupRequestDemo(
  requestId: string,
): ActionResult<{ removedId: string }> {
  const request = state.snapshot.signupRequests.find(
    (item) => item.id === requestId,
  );

  if (!request) {
    return { ok: false, message: "Solicitação não encontrada." };
  }

  if (request.status === "approved") {
    return {
      ok: false,
      message: "Cadastros aprovados não podem ser removidos.",
    };
  }

  removePendingProfileByEmail(request.email);
  state.snapshot.signupRequests = state.snapshot.signupRequests.filter(
    (item) => item.id !== requestId,
  );

  return {
    ok: true,
    message: "Solicitação removida.",
    data: { removedId: requestId },
  };
}

function removePendingProfileByEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const profile = state.snapshot.profiles.find(
    (item) => item.email.toLowerCase() === normalizedEmail,
  );

  if (!profile) return;

  const membership = state.snapshot.memberships.find(
    (item) => item.userId === profile.id,
  );
  if (membership) return;

  state.snapshot.profiles = state.snapshot.profiles.filter(
    (item) => item.id !== profile.id,
  );
  state.passwordHashes.delete(profile.id);
}

export function removeMemberDemo(
  userId: string,
  currentUserId = getDemoCurrentUser(),
): ActionResult<{ removedId: string }> {
  if (userId === currentUserId) {
    return { ok: false, message: "Voce nao pode remover sua propria conta." };
  }

  const profile = state.snapshot.profiles.find((item) => item.id === userId);

  if (!profile) {
    return { ok: false, message: "Membro nao encontrado." };
  }

  if (profile.role !== "member") {
    return { ok: false, message: "Apenas membros comuns podem ser removidos." };
  }

  state.snapshot.profiles = state.snapshot.profiles.filter(
    (item) => item.id !== userId,
  );
  state.snapshot.memberships = state.snapshot.memberships.filter(
    (item) => item.userId !== userId,
  );
  state.snapshot.matchPredictions = state.snapshot.matchPredictions.filter(
    (item) => item.userId !== userId,
  );
  state.snapshot.placementPredictions =
    state.snapshot.placementPredictions.filter(
      (item) => item.userId !== userId,
    );
  state.snapshot.signupRequests = state.snapshot.signupRequests.map((item) =>
    item.approvedUserId === userId
      ? { ...item, approvedUserId: undefined }
      : item,
  );

  return {
    ok: true,
    message: "Membro removido.",
    data: { removedId: userId },
  };
}

export function updateMemberRoleDemo(
  userId: string,
  role: UserRole,
): ActionResult<{ updatedId: string; role: UserRole }> {
  if (role !== "admin" && role !== "member") {
    return { ok: false, message: "Perfil inválido." };
  }

  const profile = state.snapshot.profiles.find((item) => item.id === userId);

  if (!profile) {
    return { ok: false, message: "Membro nao encontrado." };
  }

  if (profile.role === "owner") {
    return { ok: false, message: "Owners só podem ser alterados por script." };
  }

  profile.role = role;
  state.snapshot.memberships = state.snapshot.memberships.map((membership) =>
    membership.userId === userId ? { ...membership, role } : membership,
  );

  return {
    ok: true,
    message: "Perfil atualizado.",
    data: { updatedId: userId, role },
  };
}

export function updateProfileDemo(
  input: ProfileUpdateInput,
): ActionResult<{ updatedId: string }> {
  const profile = state.snapshot.profiles.find(
    (item) => item.id === input.userId,
  );

  if (!profile) {
    return { ok: false, message: "Perfil nao encontrado." };
  }

  if (input.avatarUrl !== undefined) {
    profile.avatarUrl = input.avatarUrl;
  }

  if (input.passwordHash) {
    state.passwordHashes.set(input.userId, input.passwordHash);
  }

  return {
    ok: true,
    message: "Perfil atualizado.",
    data: { updatedId: input.userId },
  };
}

export function createSignupRequestDemo(
  input: SignupRequestInput,
): ActionResult<{ token: string }> {
  const normalizedEmail = input.email.trim().toLowerCase();
  const existingProfile = state.snapshot.profiles.find(
    (item) => item.email.toLowerCase() === normalizedEmail,
  );

  if (existingProfile) {
    return { ok: false, message: "Este email já foi aprovado no bolão." };
  }

  const existingRequest = state.snapshot.signupRequests.find(
    (item) =>
      item.email.toLowerCase() === normalizedEmail &&
      item.status !== "rejected",
  );

  if (existingRequest) {
    return {
      ok: false,
      message: "Já existe uma solicitação aberta ou aprovada para este email.",
    };
  }

  const token = nextId("signup-token");
  state.snapshot.signupRequests.unshift({
    id: nextId("signup-request"),
    fullName: input.fullName,
    email: input.email,
    token,
    role: "member",
    status: "pending",
    requestedAt: nowIso(),
  });

  return {
    ok: true,
    message: "Cadastro enviado. Agora é só aguardar a aprovação.",
    data: { token },
  };
}

export function reviewSignupRequestDemo(
  input: SignupRequestReviewInput,
): ActionResult<{ userId: string }> {
  const request = state.snapshot.signupRequests.find(
    (item) => item.id === input.requestId,
  );

  if (!request) {
    return { ok: false, message: "Solicitação não encontrada." };
  }

  if (request.status !== "pending") {
    return { ok: false, message: "Esta solicitação já foi analisada." };
  }

  request.reviewedAt = nowIso();
  request.reviewedBy = input.reviewedByUserId ?? getDemoCurrentUser();

  if (input.action === "reject") {
    request.status = "rejected";
    removePendingProfileByEmail(request.email);
    return {
      ok: true,
      message: "Cadastro recusado.",
      data: { userId: "" },
    };
  }

  const existingProfile = state.snapshot.profiles.find(
    (item) => item.email.toLowerCase() === request.email.toLowerCase(),
  );

  const existingMembership = existingProfile
    ? state.snapshot.memberships.find(
        (item) => item.userId === existingProfile.id,
      )
    : undefined;

  if (existingMembership) {
    return { ok: false, message: "Este email já foi aprovado no bolão." };
  }

  const userId = existingProfile?.id ?? nextId("user");
  request.status = "approved";
  request.approvedUserId = userId;

  if (!existingProfile) {
    state.snapshot.profiles.push({
      id: userId,
      fullName: request.fullName,
      email: request.email,
      role: "member",
      createdAt: nowIso(),
    });
  }

  state.snapshot.memberships.push({
    id: nextId("membership"),
    userId,
    competitionId: state.snapshot.competition.id,
    role: "member",
    joinedAt: nowIso(),
  });

  return {
    ok: true,
    message: "Cadastro aprovado.",
    data: { userId },
  };
}

export function getPasswordHashByEmailDemo(email: string) {
  const profile = state.snapshot.profiles.find(
    (item) => item.email.toLowerCase() === email.trim().toLowerCase(),
  );

  return profile ? state.passwordHashes.get(profile.id) : undefined;
}

export function activateSignupRequestDemo(
  input: AccessSetupInput,
): ActionResult<AccessSetupResult> {
  const normalizedEmail = input.email.trim().toLowerCase();
  const invite = state.snapshot.accessInvites.find(
    (item) => item.token === input.token && !item.revokedAt,
  );

  if (!invite) {
    return { ok: false, message: "Link de acesso inválido." };
  }

  const existingProfile = state.snapshot.profiles.find(
    (item) => item.email.toLowerCase() === input.email.trim().toLowerCase(),
  );

  const existingMembership = existingProfile
    ? state.snapshot.memberships.find(
        (item) => item.userId === existingProfile.id,
      )
    : undefined;

  if (existingProfile && !existingMembership) {
    return {
      ok: false,
      message: "Já existe uma solicitação aberta para este email.",
    };
  }

  if (existingProfile && state.passwordHashes.has(existingProfile.id)) {
    return { ok: false, message: "Este email já tem acesso ao bolão." };
  }

  if (existingProfile) {
    state.passwordHashes.set(existingProfile.id, input.passwordHash);
    return {
      ok: true,
      message: "Senha definida.",
      data: {
        userId: existingProfile.id,
        email: existingProfile.email,
        requiresApproval: false,
      },
    };
  }

  const existingRequest = state.snapshot.signupRequests.find(
    (item) =>
      item.email.toLowerCase() === normalizedEmail &&
      (item.status === "pending" || item.status === "approved"),
  );

  if (existingRequest) {
    return {
      ok: false,
      message: "Já existe uma solicitação aberta ou aprovada para este email.",
    };
  }

  const userId = nextId("user");
  const timestamp = nowIso();

  state.snapshot.profiles.push({
    id: userId,
    fullName: input.fullName,
    email: normalizedEmail,
    role: "member",
    createdAt: timestamp,
  });
  state.snapshot.signupRequests.unshift({
    id: nextId("signup-request"),
    fullName: input.fullName,
    email: normalizedEmail,
    token: input.token,
    role: "member",
    status: "pending",
    requestedAt: timestamp,
  });
  state.passwordHashes.set(userId, input.passwordHash);

  return {
    ok: true,
    message: "Cadastro enviado. Agora é só aguardar a aprovação.",
    data: { userId, email: normalizedEmail, requiresApproval: true },
  };
}

export function createAccessInviteDemo(createdBy?: string) {
  const token = nextId("access");
  state.snapshot.accessInvites.unshift({
    id: nextId("access-invite"),
    token,
    createdAt: nowIso(),
    createdBy,
  });

  return {
    ok: true,
    message: "Link de acesso gerado.",
    data: { token },
  };
}
