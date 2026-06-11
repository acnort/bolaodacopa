import { describe, expect, it } from "vitest";

import { sampleSnapshot } from "@/lib/data/sample-data";
import { getSortedPhases } from "@/lib/domain/selectors";
import { isPhasePredictionVisible, isRuleOpen } from "@/lib/domain/scoring";
import type { PredictionRule } from "@/lib/domain/types";

describe("window validation", () => {
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
    expect(
      isPhasePredictionVisible(
        rule,
        new Date("2026-06-10T00:00:00.000Z"),
      ),
    ).toBe(false);
    expect(
      isPhasePredictionVisible(
        rule,
        new Date("2026-06-10T00:00:01.000Z"),
      ),
    ).toBe(true);
  });

  it("places final podium predictions before match phases", () => {
    const phases = getSortedPhases(sampleSnapshot.phases);
    const podiumRule = sampleSnapshot.rules.find(
      (rule) => rule.phaseId === "phase-podium",
    );

    expect(phases[0]?.id).toBe("phase-podium");
    expect(podiumRule?.enablePlacementPredictions).toBe(true);
    expect(isRuleOpen(podiumRule!, new Date("2026-06-11T14:59:58.000Z"))).toBe(
      true,
    );
    expect(isRuleOpen(podiumRule!, new Date("2026-06-11T15:00:00.000Z"))).toBe(
      false,
    );
  });
});
