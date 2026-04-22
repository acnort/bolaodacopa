import { describe, expect, it } from "vitest";

import { isInviteValid, isRuleOpen } from "@/lib/domain/scoring";
import type { PredictionRule } from "@/lib/domain/types";

describe("window validation", () => {
  it("marks invites as valid only before expiration", () => {
    expect(isInviteValid("2026-06-01T00:00:00.000Z", new Date("2026-05-20T00:00:00.000Z"))).toBe(true);
    expect(isInviteValid("2026-06-01T00:00:00.000Z", new Date("2026-06-10T00:00:00.000Z"))).toBe(false);
  });

  it("respects phase status and time window", () => {
    const rule: PredictionRule = {
      id: "rule-1",
      phaseId: "phase-1",
      enableMatchPredictions: true,
      enablePlacementPredictions: false,
      opensAt: "2026-06-01T00:00:00.000Z",
      closesAt: "2026-06-10T00:00:00.000Z",
      status: "active",
      scoring: {
        exactScore: 5,
        correctOutcome: 2,
        champion: 0,
        runnerUp: 0,
        thirdPlace: 0,
      },
    };

    expect(isRuleOpen(rule, new Date("2026-06-05T00:00:00.000Z"))).toBe(true);
    expect(isRuleOpen(rule, new Date("2026-06-11T00:00:00.000Z"))).toBe(false);
  });
});
