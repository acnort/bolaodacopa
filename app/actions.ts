"use server";

import { revalidatePath } from "next/cache";

import { inviteAcceptanceSchema, inviteSchema, matchPredictionSchema, officialResultSchema, phaseRuleSchema, placementPredictionSchema, placementResultSchema } from "@/lib/domain/schemas";
import type { ActionResult } from "@/lib/domain/types";
import {
  acceptInviteAction as acceptInviteInternal,
  createInviteAction as createInviteInternal,
  savePhasePredictionsBatchAction as savePhasePredictionsBatchInternal,
  saveMatchPredictionAction as saveMatchPredictionInternal,
  saveOfficialResultAction as saveOfficialResultInternal,
  savePhaseRuleAction as savePhaseRuleInternal,
  savePlacementPredictionAction as savePlacementPredictionInternal,
  savePlacementResultAction as savePlacementResultInternal,
} from "@/lib/services/app-service";

function toErrorResult(error: unknown): ActionResult {
  if (error && typeof error === "object" && "flatten" in error) {
    const typed = error as {
      flatten: () => { fieldErrors: Record<string, string[]> };
    };
    return {
      ok: false,
      message: "Verifique os campos destacados.",
      fieldErrors: typed.flatten().fieldErrors,
    };
  }

  return { ok: false, message: "Nao foi possivel concluir a operacao." };
}

export async function saveMatchPrediction(
  _prevState: ActionResult | undefined,
  formData: FormData,
) {
  try {
    matchPredictionSchema.parse({
      userId: formData.get("userId"),
      matchId: formData.get("matchId"),
      homeScore: formData.get("homeScore"),
      awayScore: formData.get("awayScore"),
    });

    const result = await saveMatchPredictionInternal(formData);
    revalidatePath("/app");
    revalidatePath("/app/palpites");
    revalidatePath("/app/ranking");
    return result;
  } catch (error) {
    return toErrorResult(error);
  }
}

export async function savePhasePredictionsBatch(
  _prevState: ActionResult | undefined,
  formData: FormData,
) {
  try {
    const phaseId = String(formData.get("phaseId") ?? "");
    const userId = String(formData.get("userId") ?? "");
    const predictions = Array.from(formData.entries())
      .filter(([key]) => key.startsWith("homeScore:"))
      .flatMap(([key, value]) => {
        const matchId = key.replace("homeScore:", "");
        const awayKey = `awayScore:${matchId}`;
        const awayValue = formData.get(awayKey);
        const homeScoreRaw = String(value ?? "").trim();
        const awayScoreRaw = String(awayValue ?? "").trim();

        if (!homeScoreRaw && !awayScoreRaw) {
          return [];
        }

        if (!homeScoreRaw || !awayScoreRaw) {
          throw new Error("Preencha os dois placares antes de salvar a fase.");
        }

        return [
          {
            matchId,
            homeScore: Number(homeScoreRaw),
            awayScore: Number(awayScoreRaw),
          },
        ];
      });

    const championTeamId = String(formData.get("championTeamId") ?? "").trim();
    const runnerUpTeamId = String(formData.get("runnerUpTeamId") ?? "").trim();
    const thirdPlaceTeamId = String(formData.get("thirdPlaceTeamId") ?? "").trim();
    const competitionId = String(formData.get("competitionId") ?? "").trim();

    const result = await savePhasePredictionsBatchInternal({
      userId,
      phaseId,
      predictions,
      placementPrediction:
        championTeamId && runnerUpTeamId && thirdPlaceTeamId && competitionId
          ? {
              competitionId,
              championTeamId,
              runnerUpTeamId,
              thirdPlaceTeamId,
            }
          : undefined,
    });

    revalidatePath("/app");
    revalidatePath("/app/palpites");
    revalidatePath("/app/ranking");
    revalidatePath("/app/podio");
    return result;
  } catch (error) {
    if (error instanceof Error) {
      return { ok: false, message: error.message };
    }
    return toErrorResult(error);
  }
}

export async function savePlacementPrediction(
  _prevState: ActionResult | undefined,
  formData: FormData,
) {
  try {
    placementPredictionSchema.parse({
      userId: formData.get("userId"),
      competitionId: formData.get("competitionId"),
      championTeamId: formData.get("championTeamId"),
      runnerUpTeamId: formData.get("runnerUpTeamId"),
      thirdPlaceTeamId: formData.get("thirdPlaceTeamId"),
    });

    const result = await savePlacementPredictionInternal(formData);
    revalidatePath("/app");
    revalidatePath("/app/podio");
    revalidatePath("/app/ranking");
    return result;
  } catch (error) {
    return toErrorResult(error);
  }
}

export async function createInvite(
  _prevState: ActionResult | undefined,
  formData: FormData,
) {
  try {
    inviteSchema.parse({
      email: formData.get("email"),
      role: formData.get("role"),
      expiresAt: formData.get("expiresAt"),
    });

    const result = await createInviteInternal(formData);
    revalidatePath("/app/admin");
    return result;
  } catch (error) {
    return toErrorResult(error);
  }
}

export async function acceptInvite(
  _prevState: ActionResult | undefined,
  formData: FormData,
) {
  try {
    inviteAcceptanceSchema.parse({
      token: formData.get("token"),
      fullName: formData.get("fullName"),
      password: formData.get("password"),
    });

    const result = await acceptInviteInternal(formData);
    revalidatePath("/app/admin");
    return result;
  } catch (error) {
    return toErrorResult(error);
  }
}

export async function saveOfficialResult(
  _prevState: ActionResult | undefined,
  formData: FormData,
) {
  try {
    officialResultSchema.parse({
      matchId: formData.get("matchId"),
      homeScore: formData.get("homeScore"),
      awayScore: formData.get("awayScore"),
      status: formData.get("status"),
    });

    const result = await saveOfficialResultInternal(formData);
    revalidatePath("/app");
    revalidatePath("/app/admin");
    revalidatePath("/app/ranking");
    return result;
  } catch (error) {
    return toErrorResult(error);
  }
}

export async function savePlacementResult(
  _prevState: ActionResult | undefined,
  formData: FormData,
) {
  try {
    placementResultSchema.parse({
      competitionId: formData.get("competitionId"),
      championTeamId: formData.get("championTeamId"),
      runnerUpTeamId: formData.get("runnerUpTeamId"),
      thirdPlaceTeamId: formData.get("thirdPlaceTeamId"),
    });

    const result = await savePlacementResultInternal(formData);
    revalidatePath("/app");
    revalidatePath("/app/admin");
    revalidatePath("/app/ranking");
    return result;
  } catch (error) {
    return toErrorResult(error);
  }
}

export async function savePhaseRule(
  _prevState: ActionResult | undefined,
  formData: FormData,
) {
  try {
    phaseRuleSchema.parse({
      phaseId: formData.get("phaseId"),
      enableMatchPredictions: formData.get("enableMatchPredictions") === "on",
      enablePlacementPredictions:
        formData.get("enablePlacementPredictions") === "on",
      opensAt: formData.get("opensAt"),
      closesAt: formData.get("closesAt"),
      exactScore: formData.get("exactScore"),
      correctOutcome: formData.get("correctOutcome"),
      champion: formData.get("champion"),
      runnerUp: formData.get("runnerUp"),
      thirdPlace: formData.get("thirdPlace"),
      status: formData.get("status"),
    });

    const result = await savePhaseRuleInternal(formData);
    revalidatePath("/app");
    revalidatePath("/app/admin");
    revalidatePath("/app/palpites");
    revalidatePath("/app/podio");
    return result;
  } catch (error) {
    return toErrorResult(error);
  }
}
