import { beforeEach, describe, expect, it } from "vitest";

import {
  getDemoSnapshot,
  resetDemoStore,
  saveMatchPredictionDemo,
  savePhaseRuleDemo,
} from "@/lib/services/demo-store";

describe("demo store", () => {
  beforeEach(() => {
    resetDemoStore();
  });

  it("updates an existing match prediction", () => {
    const result = saveMatchPredictionDemo({
      userId: "user-ana",
      matchId: "match-1",
      homeScore: 4,
      awayScore: 0,
    });

    expect(result.ok).toBe(true);
    expect(
      getDemoSnapshot().matchPredictions.find(
        (prediction) =>
          prediction.userId === "user-ana" && prediction.matchId === "match-1",
      )?.homeScore,
    ).toBe(4);
  });

  it("updates phase scoring rules", () => {
    const result = savePhaseRuleDemo({
      phaseId: "phase-groups",
      enableMatchPredictions: true,
      enablePlacementPredictions: false,
      opensAt: "2026-06-10T00:00",
      closesAt: "2026-06-30T23:59",
      exactScore: 9,
      correctOutcome: 3,
      champion: 0,
      runnerUp: 0,
      thirdPlace: 0,
      status: "active",
    });

    expect(result.ok).toBe(true);
    expect(
      getDemoSnapshot().rules.find((rule) => rule.phaseId === "phase-groups")?.scoring.exactScore,
    ).toBe(9);
  });
});
