import { describe, expect, it } from "vitest";

import {
  buildScoreEntries,
  isMatchResultPublic,
  scoreMatchPrediction,
  scorePlacementPrediction,
} from "@/lib/domain/scoring";
import type {
  AppSnapshot,
  MatchPrediction,
  PlacementPrediction,
  PlacementResult,
  PredictionRule,
} from "@/lib/domain/types";

const rule: PredictionRule = {
  id: "rule-1",
  phaseId: "phase-1",
  enableMatchPredictions: true,
  enablePlacementPredictions: true,
  opensAt: "2026-06-01T00:00:00.000Z",
  closesAt: "2026-06-30T00:00:00.000Z",
  status: "active",
  scoring: {
    exactScore: 5,
    correctOutcome: 2,
    champion: 10,
    runnerUp: 6,
    thirdPlace: 4,
  },
};

describe("scoring", () => {
  it("awards exact-score points before outcome points", () => {
    const prediction: MatchPrediction = {
      id: "p1",
      userId: "user-1",
      matchId: "match-1",
      homeScore: 2,
      awayScore: 1,
      createdAt: "",
      updatedAt: "",
    };

    const result = scoreMatchPrediction(
      prediction,
      { matchId: "match-1", homeScore: 2, awayScore: 1, publishedAt: "" },
      rule,
    );

    expect(result.points).toBe(5);
    expect(result.exactHit).toBe(true);
    expect(result.outcomeHit).toBe(false);
  });

  it("awards outcome-only points when the winner is correct", () => {
    const prediction: MatchPrediction = {
      id: "p2",
      userId: "user-1",
      matchId: "match-2",
      homeScore: 1,
      awayScore: 0,
      createdAt: "",
      updatedAt: "",
    };

    const result = scoreMatchPrediction(
      prediction,
      { matchId: "match-2", homeScore: 3, awayScore: 1, publishedAt: "" },
      rule,
    );

    expect(result.points).toBe(2);
    expect(result.exactHit).toBe(false);
    expect(result.outcomeHit).toBe(true);
  });

  it("scores against the 90-minute result when total result differs", () => {
    const prediction: MatchPrediction = {
      id: "p-extra-time",
      userId: "user-1",
      matchId: "match-extra-time",
      homeScore: 1,
      awayScore: 1,
      createdAt: "",
      updatedAt: "",
    };

    const result = scoreMatchPrediction(
      prediction,
      {
        matchId: "match-extra-time",
        homeScore: 1,
        awayScore: 1,
        totalHomeScore: 2,
        totalAwayScore: 1,
        publishedAt: "",
      },
      rule,
    );

    expect(result.points).toBe(5);
    expect(result.exactHit).toBe(true);
  });

  it("scores podium picks independently", () => {
    const prediction: PlacementPrediction = {
      id: "placement-1",
      userId: "user-1",
      competitionId: "world-cup",
      championTeamId: "bra",
      runnerUpTeamId: "arg",
      thirdPlaceTeamId: "fra",
      updatedAt: "",
    };
    const result: PlacementResult = {
      competitionId: "world-cup",
      championTeamId: "bra",
      runnerUpTeamId: "arg",
      thirdPlaceTeamId: "esp",
      publishedAt: "",
    };

    const score = scorePlacementPrediction(prediction, result, rule);
    expect(score.points).toBe(16);
    expect(score.exactHit).toBe(false);
    expect(score.outcomeHit).toBe(true);
  });

  it("only exposes match results after kickoff and publication", () => {
    const match = { kickoffAt: "2026-06-12T20:00:00.000Z" };
    const result = { publishedAt: "2026-06-10T20:00:00.000Z" };

    expect(
      isMatchResultPublic(match, result, new Date("2026-06-11T20:00:00.000Z")),
    ).toBe(false);
    expect(
      isMatchResultPublic(match, result, new Date("2026-06-12T20:00:00.000Z")),
    ).toBe(true);
  });

  it("does not score published match results before kickoff", () => {
    const snapshot = {
      competition: {
        id: "world-cup",
        name: "World Cup",
        edition: "2026",
        host: "Test",
      },
      teams: [],
      phases: [],
      rules: [rule],
      matches: [
        {
          id: "match-1",
          phaseId: rule.phaseId,
          roundLabel: "Round 1",
          kickoffAt: "2026-06-12T20:00:00.000Z",
          venue: "Test",
          status: "scheduled",
        },
      ],
      results: [
        {
          matchId: "match-1",
          homeScore: 2,
          awayScore: 1,
          publishedAt: "2026-06-10T20:00:00.000Z",
        },
      ],
      placementResult: {
        competitionId: "world-cup",
      },
      profiles: [],
      accessInvites: [],
      signupRequests: [],
      memberships: [],
      matchPredictions: [
        {
          id: "prediction-1",
          userId: "user-1",
          matchId: "match-1",
          homeScore: 2,
          awayScore: 1,
          createdAt: "",
          updatedAt: "",
        },
      ],
      placementPredictions: [],
    } satisfies AppSnapshot;

    expect(
      buildScoreEntries(snapshot, new Date("2026-06-11T20:00:00.000Z")),
    ).toHaveLength(0);
    expect(
      buildScoreEntries(snapshot, new Date("2026-06-12T20:00:00.000Z")),
    ).toHaveLength(1);
  });
});
