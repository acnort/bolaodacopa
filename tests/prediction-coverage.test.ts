import { describe, expect, it } from "vitest";

import { sampleSnapshot } from "@/lib/data/sample-data";
import { buildAdminPredictionCoverage } from "@/lib/domain/prediction-coverage";

describe("admin prediction coverage", () => {
  it("builds phase progress without exposing prediction scores", () => {
    const coverage = buildAdminPredictionCoverage(sampleSnapshot);
    const groupPhase = coverage.phases.find(
      (phase) => phase.id === "phase-groups",
    );
    const ana = coverage.members.find((member) => member.userId === "user-ana");
    const anaGroups = ana?.phases.find(
      (phase) => phase.phaseId === "phase-groups",
    );

    expect(coverage.phases.some((phase) => phase.id === "phase-podium")).toBe(
      false,
    );
    expect(groupPhase?.totalMatches).toBe(72);
    expect(anaGroups?.savedCount).toBe(3);
    expect(anaGroups?.totalCount).toBe(72);
    expect(anaGroups?.missingMatches).toHaveLength(69);
    expect(JSON.stringify(coverage)).not.toContain("homeScore");
    expect(JSON.stringify(coverage)).not.toContain("awayScore");
  });
});
