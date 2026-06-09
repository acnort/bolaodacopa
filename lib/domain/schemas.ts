import { z } from "zod";

import { normalizeAppDateTimeToIso } from "@/lib/app-time";

const appDateTimeSchema = z
  .string()
  .min(1)
  .transform((value, context) => {
    const isoValue = normalizeAppDateTimeToIso(value);

    if (!isoValue) {
      context.addIssue({
        code: "custom",
        message: "Data e hora invalidas.",
      });
      return z.NEVER;
    }

    return isoValue;
  });

export const matchPredictionSchema = z.object({
  userId: z.string().min(1),
  matchId: z.string().min(1),
  homeScore: z.coerce.number().int().min(0).max(20),
  awayScore: z.coerce.number().int().min(0).max(20),
});

export const placementPredictionSchema = z
  .object({
    userId: z.string().min(1),
    competitionId: z.string().min(1),
    championTeamId: z.string().min(1),
    runnerUpTeamId: z.string().min(1),
    thirdPlaceTeamId: z.string().min(1),
  })
  .refine(
    (value) =>
      new Set([
        value.championTeamId,
        value.runnerUpTeamId,
        value.thirdPlaceTeamId,
      ]).size === 3,
    {
      message: "Campeão, vice e terceiro precisam ser times diferentes.",
      path: ["thirdPlaceTeamId"],
    },
  );

export const officialResultSchema = z.object({
  matchId: z.string().min(1),
  homeScore: z.coerce.number().int().min(0).max(20),
  awayScore: z.coerce.number().int().min(0).max(20),
  status: z.enum(["scheduled", "in_progress", "completed"]),
});

export const placementResultSchema = z
  .object({
    competitionId: z.string().min(1),
    championTeamId: z.string().min(1),
    runnerUpTeamId: z.string().min(1),
    thirdPlaceTeamId: z.string().min(1),
  })
  .refine(
    (value) =>
      new Set([
        value.championTeamId,
        value.runnerUpTeamId,
        value.thirdPlaceTeamId,
      ]).size === 3,
    {
      message: "Resultados do pódio precisam apontar times diferentes.",
      path: ["thirdPlaceTeamId"],
    },
  );

export const phaseRuleSchema = z.object({
  phaseId: z.string().min(1),
  enableMatchPredictions: z.coerce.boolean(),
  enablePlacementPredictions: z.coerce.boolean(),
  opensAt: appDateTimeSchema,
  closesAt: appDateTimeSchema,
  exactScore: z.coerce.number().int().min(0).max(100),
  correctOutcome: z.coerce.number().int().min(0).max(100),
  champion: z.coerce.number().int().min(0).max(100),
  runnerUp: z.coerce.number().int().min(0).max(100),
  thirdPlace: z.coerce.number().int().min(0).max(100),
  status: z.enum(["draft", "active", "locked"]),
});

export const phaseRulesBatchSchema = z.object({
  rules: z.array(phaseRuleSchema).min(1),
});

export const phasePredictionBatchSchema = z.object({
  userId: z.string().min(1),
  phaseId: z.string().min(1),
  predictions: z.array(
    matchPredictionSchema.pick({
      matchId: true,
      homeScore: true,
      awayScore: true,
    }),
  ),
  placementPrediction: placementPredictionSchema
    .pick({
      competitionId: true,
      championTeamId: true,
      runnerUpTeamId: true,
      thirdPlaceTeamId: true,
    })
    .optional(),
});

export const signupRequestSchema = z.object({
  fullName: z.string().min(3).max(80),
  email: z.email(),
});

export const accessSetupSchema = z
  .object({
    token: z.string().min(1),
    fullName: z.string().min(3).max(80),
    email: z.email(),
    password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres."),
    confirmPassword: z.string().min(8),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "As senhas precisam ser iguais.",
    path: ["confirmPassword"],
  });

export const signupRequestRemovalSchema = z.object({
  requestId: z.string().min(1),
});

export const memberRemovalSchema = z.object({
  userId: z.string().min(1),
});

export const memberRoleUpdateSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["admin", "member"]),
});

export const signupRequestReviewSchema = z.object({
  requestId: z.string().min(1),
  action: z.enum(["approve", "reject"]),
});

export const authSchema = z.object({
  email: z.email(),
  password: z.string().min(1, "Informe sua senha."),
});
