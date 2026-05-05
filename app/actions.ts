"use server";

import { revalidatePath } from "next/cache";

import { authSchema, matchPredictionSchema, memberRemovalSchema, officialResultSchema, phaseRuleSchema, phaseRulesBatchSchema, placementPredictionSchema, placementResultSchema, signupRequestRemovalSchema, signupRequestReviewSchema, signupRequestSchema } from "@/lib/domain/schemas";
import type { ActionResult } from "@/lib/domain/types";
import {
  removeMemberAction as removeMemberInternal,
  removeSignupRequestAction as removeSignupRequestInternal,
  reviewSignupRequestAction as reviewSignupRequestInternal,
  savePhasePredictionsBatchAction as savePhasePredictionsBatchInternal,
  saveMatchPredictionAction as saveMatchPredictionInternal,
  saveOfficialResultAction as saveOfficialResultInternal,
  savePhaseRuleAction as savePhaseRuleInternal,
  savePhaseRulesBatchAction as savePhaseRulesBatchInternal,
  savePlacementPredictionAction as savePlacementPredictionInternal,
  savePlacementResultAction as savePlacementResultInternal,
  signInAction as signInInternal,
  createSignupRequestAction as createSignupRequestInternal,
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

export async function createSignupRequest(
  _prevState: ActionResult | undefined,
  formData: FormData,
) {
  try {
    signupRequestSchema.parse({
      fullName: formData.get("fullName"),
      email: formData.get("email"),
    });

    const result = await createSignupRequestInternal(formData);
    revalidatePath("/cadastro");
    revalidatePath("/app/admin");
    return result;
  } catch (error) {
    return toErrorResult(error);
  }
}

export async function reviewSignupRequest(
  _prevState: ActionResult | undefined,
  formData: FormData,
) {
  try {
    signupRequestReviewSchema.parse({
      requestId: formData.get("requestId"),
      action: formData.get("action"),
    });

    const result = await reviewSignupRequestInternal(formData);
    revalidatePath("/app/admin");
    revalidatePath("/cadastro");
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

export async function savePhaseRulesBatch(
  _prevState: ActionResult | undefined,
  formData: FormData,
) {
  try {
    const phaseIds = formData.getAll("phaseId").map(String);
    const rules = phaseIds.map((phaseId) => ({
      phaseId,
      enableMatchPredictions:
        formData.get(`enableMatchPredictions:${phaseId}`) === "true",
      enablePlacementPredictions:
        formData.get(`enablePlacementPredictions:${phaseId}`) === "true",
      opensAt: formData.get(`opensAt:${phaseId}`),
      closesAt: formData.get(`closesAt:${phaseId}`),
      exactScore: formData.get(`exactScore:${phaseId}`),
      correctOutcome: formData.get(`correctOutcome:${phaseId}`),
      champion: formData.get(`champion:${phaseId}`),
      runnerUp: formData.get(`runnerUp:${phaseId}`),
      thirdPlace: formData.get(`thirdPlace:${phaseId}`),
      status: formData.get(`status:${phaseId}`),
    }));

    const parsed = phaseRulesBatchSchema.parse({ rules });
    const result = await savePhaseRulesBatchInternal(parsed.rules);

    revalidatePath("/app");
    revalidatePath("/app/admin");
    revalidatePath("/app/palpites");
    revalidatePath("/app/ranking");
    return result;
  } catch (error) {
    return toErrorResult(error);
  }
}

export async function removeSignupRequest(
  _prevState: ActionResult | undefined,
  formData: FormData,
) {
  try {
    signupRequestRemovalSchema.parse({
      requestId: formData.get("requestId"),
    });

    const result = await removeSignupRequestInternal(formData);
    revalidatePath("/app/admin");
    return result;
  } catch (error) {
    return toErrorResult(error);
  }
}

export async function signIn(
  _prevState: ActionResult | undefined,
  formData: FormData,
) {
  try {
    authSchema.parse({
      email: formData.get("email"),
    });

    const result = await signInInternal(formData);
    revalidatePath("/app");
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

export async function removeMember(
  _prevState: ActionResult | undefined,
  formData: FormData,
) {
  try {
    memberRemovalSchema.parse({
      userId: formData.get("userId"),
    });

    const result = await removeMemberInternal(formData);
    revalidatePath("/app");
    revalidatePath("/app/admin");
    revalidatePath("/app/ranking");
    return result;
  } catch (error) {
    return toErrorResult(error);
  }
}
