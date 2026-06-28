import { describe, expect, it } from "vitest";

import { sampleSnapshot } from "@/lib/data/sample-data";
import { getCurrentPhase, getSortedPhases } from "@/lib/domain/selectors";
import {
  getMatchPredictionClosesAt,
  getNextMatchPredictionClosesAt,
  isMatchPredictionVisible,
  isMatchPredictionOpen,
  isPhasePredictionVisible,
  isRuleOpen,
} from "@/lib/domain/scoring";
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
      isPhasePredictionVisible(rule, new Date("2026-06-10T00:00:00.000Z")),
    ).toBe(false);
    expect(
      isPhasePredictionVisible(rule, new Date("2026-06-10T00:00:01.000Z")),
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

  it("finds the phase currently in progress", () => {
    const phases = getSortedPhases(sampleSnapshot.phases);

    expect(getCurrentPhase(phases, new Date("2026-06-28T12:00:00.000Z"))?.id)
      .toBe("phase-groups");
    expect(getCurrentPhase(phases, new Date("2026-07-01T15:00:00.000Z"))?.id)
      .toBe("phase-round-32");
    expect(getCurrentPhase(phases, new Date("2026-03-31T12:00:00.000Z"))).toBe(
      undefined,
    );
  });

  it("keeps group matches open until the phase closes", () => {
    const rule = sampleSnapshot.rules.find(
      (item) => item.phaseId === "phase-groups",
    );
    const match = sampleSnapshot.matches.find(
      (item) => item.phaseId === "phase-groups",
    );

    expect(
      isMatchPredictionOpen(rule, match, new Date("2026-06-11T18:30:00.000Z")),
    ).toBe(true);
  });

  it("closes knockout matches one hour before kickoff", () => {
    const rule = sampleSnapshot.rules.find(
      (item) => item.phaseId === "phase-round-32",
    );
    const match = sampleSnapshot.matches.find(
      (item) => item.phaseId === "phase-round-32",
    )!;
    const closesAt = getMatchPredictionClosesAt(match);

    expect(closesAt.toISOString()).toBe("2026-07-01T16:00:00.000Z");
    expect(
      isMatchPredictionOpen(rule, match, new Date("2026-07-01T15:59:59.000Z")),
    ).toBe(true);
    expect(
      isMatchPredictionOpen(rule, match, new Date("2026-07-01T16:00:01.000Z")),
    ).toBe(false);
    expect(
      isMatchPredictionVisible(
        rule,
        match,
        new Date("2026-07-01T16:00:00.000Z"),
      ),
    ).toBe(false);
    expect(
      isMatchPredictionVisible(
        rule,
        match,
        new Date("2026-07-01T16:00:01.000Z"),
      ),
    ).toBe(true);
  });

  it("finds the next knockout match closing time", () => {
    const matches = sampleSnapshot.matches.filter(
      (item) => item.phaseId === "phase-round-32",
    );

    expect(
      getNextMatchPredictionClosesAt(
        matches,
        new Date("2026-07-01T16:00:01.000Z"),
      )?.toISOString(),
    ).toBe("2026-07-01T22:00:00.000Z");
  });
});
