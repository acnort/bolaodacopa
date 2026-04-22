import "server-only";

import { demoCurrentUserId, sampleSnapshot } from "@/lib/data/sample-data";
import {
  type ActionResult,
  type AppSnapshot,
  type InviteAcceptanceInput,
  type InviteInput,
  type MatchPredictionInput,
  type OfficialResultInput,
  type PhaseBatchPredictionInput,
  type PhaseRuleInput,
  type PlacementPredictionInput,
  type PlacementResultInput,
} from "@/lib/domain/types";

const state = {
  snapshot: structuredClone(sampleSnapshot) as AppSnapshot,
};

function nowIso() {
  return new Date().toISOString();
}

function nextId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getDemoSnapshot() {
  return structuredClone(state.snapshot);
}

export function getDemoCurrentUser() {
  return demoCurrentUserId;
}

export function resetDemoStore() {
  state.snapshot = structuredClone(sampleSnapshot);
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

  return { ok: true, message: "Palpite de jogo salvo.", data: { updatedId: id } };
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
      updatedCount > 0 ? "Palpites da fase salvos." : "Nenhuma alteração enviada.",
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
  const match = state.snapshot.matches.find((item) => item.id === input.matchId);
  if (!match) {
    return { ok: false, message: "Partida nao encontrada." };
  }

  match.status = input.status;

  const existing = state.snapshot.results.find((item) => item.matchId === input.matchId);
  if (existing) {
    existing.homeScore = input.homeScore;
    existing.awayScore = input.awayScore;
    existing.publishedAt = nowIso();
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
  });

  return {
    ok: true,
    message: "Resultado oficial salvo.",
    data: { updatedId: input.matchId },
  };
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
  const existing = state.snapshot.rules.find((item) => item.phaseId === input.phaseId);
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

export function createInviteDemo(input: InviteInput): ActionResult<{ token: string }> {
  const token = nextId("invite-token");
  state.snapshot.invites.unshift({
    id: nextId("invite"),
    email: input.email,
    token,
    role: input.role,
    invitedBy: getDemoCurrentUser(),
    status: "pending",
    expiresAt: input.expiresAt,
  });

  return {
    ok: true,
    message: "Convite criado em modo demonstracao.",
    data: { token },
  };
}

export function acceptInviteDemo(
  input: InviteAcceptanceInput,
): ActionResult<{ userId: string }> {
  const invite = state.snapshot.invites.find((item) => item.token === input.token);
  if (!invite) {
    return { ok: false, message: "Convite nao encontrado." };
  }

  invite.status = "accepted";
  invite.acceptedAt = nowIso();

  const userId = nextId("user");
  state.snapshot.profiles.push({
    id: userId,
    fullName: input.fullName,
    email: invite.email,
    role: invite.role,
    createdAt: nowIso(),
  });
  state.snapshot.memberships.push({
    id: nextId("membership"),
    userId,
    competitionId: state.snapshot.competition.id,
    role: invite.role,
    joinedAt: nowIso(),
  });

  return {
    ok: true,
    message: "Convite aceito. Conta criada em modo demonstracao.",
    data: { userId },
  };
}
