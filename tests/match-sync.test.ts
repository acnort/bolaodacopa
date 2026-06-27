import { describe, expect, it } from "vitest";

import { sampleSnapshot } from "@/lib/data/sample-data";
import type { AppSnapshot, Match } from "@/lib/domain/types";
import { buildSyncedMatchInputs } from "@/lib/services/match-sync";

function cloneSnapshot(): AppSnapshot {
  return JSON.parse(JSON.stringify(sampleSnapshot)) as AppSnapshot;
}

function completePhase(snapshot: AppSnapshot, phaseId: string) {
  const phaseMatches = snapshot.matches.filter(
    (match) => match.phaseId === phaseId,
  );
  const phaseMatchIds = new Set(phaseMatches.map((match) => match.id));

  for (const match of phaseMatches) {
    match.status = "completed";
  }

  snapshot.results = [
    ...snapshot.results.filter((result) => !phaseMatchIds.has(result.matchId)),
    ...phaseMatches.map((match) => ({
      matchId: match.id,
      homeScore: 1,
      awayScore: 0,
      publishedAt: "2026-07-01T03:00:00.000Z",
    })),
  ];
}

function buildExternalMatch(
  overrides: Partial<Match> & Pick<Match, "id" | "phaseId" | "roundLabel">,
): Match {
  const teams = sampleSnapshot.teams;

  return {
    externalMatchId: overrides.id,
    kickoffAt: "2026-07-01T17:00:00.000Z",
    venue: "A definir",
    homeTeamId: teams[0]!.id,
    awayTeamId: teams[1]!.id,
    status: "scheduled",
    ...overrides,
  };
}

describe("match sync input builder", () => {
  it("does not fill next-phase slots before the previous phase is complete", () => {
    const snapshot = cloneSnapshot();
    const providerMatch = buildExternalMatch({
      id: "external-round32-1",
      phaseId: "phase-round-32",
      roundLabel: "16-avos",
    });

    const result = buildSyncedMatchInputs({
      snapshot,
      providerMatches: [providerMatch],
      providerResults: [],
    });

    expect(result.syncedInputs).toHaveLength(0);
    expect(result.unmatchedMatches).toBe(1);
  });

  it("references an open next-phase slot without locking teams", () => {
    const snapshot = cloneSnapshot();
    const providerMatch = buildExternalMatch({
      id: "external-round32-1",
      phaseId: "phase-round-32",
      roundLabel: "16-avos",
      homeTeamId: undefined,
      awayTeamId: undefined,
    });

    const result = buildSyncedMatchInputs({
      snapshot,
      providerMatches: [providerMatch],
      providerResults: [],
      referenceOpenPhaseSlots: true,
    });

    expect(result.unmatchedMatches).toBe(0);
    expect(result.syncedInputs).toEqual([
      expect.objectContaining({
        matchId: "round32-1",
        externalMatchId: "external-round32-1",
        homeTeamId: undefined,
        awayTeamId: undefined,
      }),
    ]);
  });

  it("does not sync teams into an externally referenced open slot", () => {
    const snapshot = cloneSnapshot();
    const match = snapshot.matches.find((item) => item.id === "round32-1")!;
    match.externalMatchId = "external-round32-1";
    const providerMatch = buildExternalMatch({
      id: "external-round32-1",
      phaseId: "phase-round-32",
      roundLabel: "16-avos",
    });

    const result = buildSyncedMatchInputs({
      snapshot,
      providerMatches: [providerMatch],
      providerResults: [],
    });

    expect(result.unmatchedMatches).toBe(0);
    expect(result.syncedInputs).toEqual([
      expect.objectContaining({
        matchId: "round32-1",
        externalMatchId: "external-round32-1",
        homeTeamId: undefined,
        awayTeamId: undefined,
      }),
    ]);
  });

  it("fills an empty next-phase slot after the previous phase is complete", () => {
    const snapshot = cloneSnapshot();
    completePhase(snapshot, "phase-groups");
    const providerMatch = buildExternalMatch({
      id: "external-round32-1",
      phaseId: "phase-round-32",
      roundLabel: "16-avos",
    });

    const result = buildSyncedMatchInputs({
      snapshot,
      providerMatches: [providerMatch],
      providerResults: [],
    });

    expect(result.unmatchedMatches).toBe(0);
    expect(result.syncedInputs).toEqual([
      expect.objectContaining({
        matchId: "round32-1",
        externalMatchId: "external-round32-1",
        homeTeamId: providerMatch.homeTeamId,
        awayTeamId: providerMatch.awayTeamId,
      }),
    ]);
  });

  it("fills partial team data after the previous phase is complete", () => {
    const snapshot = cloneSnapshot();
    completePhase(snapshot, "phase-groups");
    const providerMatch = buildExternalMatch({
      id: "external-round32-1",
      phaseId: "phase-round-32",
      roundLabel: "16-avos",
      awayTeamId: undefined,
    });

    const result = buildSyncedMatchInputs({
      snapshot,
      providerMatches: [providerMatch],
      providerResults: [],
    });

    expect(result.unmatchedMatches).toBe(0);
    expect(result.syncedInputs).toEqual([
      expect.objectContaining({
        matchId: "round32-1",
        externalMatchId: "external-round32-1",
        homeTeamId: providerMatch.homeTeamId,
        awayTeamId: undefined,
      }),
    ]);
  });

  it("keeps existing external-id matches eligible before phase completion", () => {
    const snapshot = cloneSnapshot();
    const match = snapshot.matches.find((item) => item.id === "round32-1")!;
    match.externalMatchId = "external-round32-1";
    const providerMatch = buildExternalMatch({
      id: "external-round32-1",
      phaseId: "phase-round-32",
      roundLabel: "16-avos",
    });

    const result = buildSyncedMatchInputs({
      snapshot,
      providerMatches: [providerMatch],
      providerResults: [],
    });

    expect(result.unmatchedMatches).toBe(0);
    expect(result.syncedInputs[0]?.matchId).toBe("round32-1");
  });

  it("does not put third-place data into the final slot", () => {
    const snapshot = cloneSnapshot();
    completePhase(snapshot, "phase-semifinals");
    const providerMatch = buildExternalMatch({
      id: "external-third-place",
      phaseId: "phase-final",
      roundLabel: "Terceiro lugar",
      kickoffAt: "2026-07-18T22:00:00.000Z",
    });

    const result = buildSyncedMatchInputs({
      snapshot,
      providerMatches: [providerMatch],
      providerResults: [],
    });

    expect(result.syncedInputs).toHaveLength(0);
    expect(result.unmatchedMatches).toBe(1);
  });
});
