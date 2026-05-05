import { z } from "zod";

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
  opensAt: z.string().min(1),
  closesAt: z.string().min(1),
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

export const signupRequestSchema = z.object({
  fullName: z.string().min(3).max(80),
  email: z.email(),
});

export const signupRequestRemovalSchema = z.object({
  requestId: z.string().min(1),
});

export const memberRemovalSchema = z.object({
  userId: z.string().min(1),
});

export const signupRequestReviewSchema = z.object({
  requestId: z.string().min(1),
  action: z.enum(["approve", "reject"]),
});

export const authSchema = z.object({
  email: z.email(),
});
