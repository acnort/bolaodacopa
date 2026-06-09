import { describe, expect, it } from "vitest";

import { phasePredictionBatchSchema } from "@/lib/domain/schemas";

describe("phasePredictionBatchSchema", () => {
  it("parses batch predictions with placement prediction", () => {
    const parsed = phasePredictionBatchSchema.parse({
      userId: "user-1",
      phaseId: "phase-1",
      predictions: [
        {
          matchId: "match-1",
          homeScore: 2,
          awayScore: 1,
        },
      ],
      placementPrediction: {
        competitionId: "competition-1",
        championTeamId: "team-1",
        runnerUpTeamId: "team-2",
        thirdPlaceTeamId: "team-3",
      },
    });

    expect(parsed.placementPrediction?.championTeamId).toBe("team-1");
  });

  it("rejects repeated placement teams in batch predictions", () => {
    expect(() =>
      phasePredictionBatchSchema.parse({
        userId: "user-1",
        phaseId: "phase-1",
        predictions: [],
        placementPrediction: {
          competitionId: "competition-1",
          championTeamId: "team-1",
          runnerUpTeamId: "team-1",
          thirdPlaceTeamId: "team-3",
        },
      }),
    ).toThrow();
  });
});
