import { describe, expect, it } from "vitest";

import {
  buildLeaderboardEntries,
  buildLiveLeaderboardMovements,
} from "@/lib/domain/scoring";
import type { AppSnapshot, Profile, ScoreEntry } from "@/lib/domain/types";

describe("ranking tiebreakers", () => {
  it("sorts by points, then exact hits, then outcome hits, then profile creation date", () => {
    const profiles: Profile[] = [
      {
        id: "u1",
        fullName: "Ana",
        email: "ana@test.dev",
        role: "member",
        createdAt: "2026-01-01T10:00:00.000Z",
      },
      {
        id: "u2",
        fullName: "Bruno",
        email: "bruno@test.dev",
        role: "member",
        createdAt: "2026-01-01T11:00:00.000Z",
      },
      {
        id: "u3",
        fullName: "Carla",
        email: "carla@test.dev",
        role: "member",
        createdAt: "2026-01-01T12:00:00.000Z",
      },
    ];

    const entries: ScoreEntry[] = [
      {
        id: "1",
        userId: "u1",
        phaseId: "p",
        sourceType: "match",
        sourceId: "m1",
        points: 10,
        exactHit: true,
        outcomeHit: true,
        description: "",
      },
      {
        id: "2",
        userId: "u2",
        phaseId: "p",
        sourceType: "match",
        sourceId: "m2",
        points: 10,
        exactHit: false,
        outcomeHit: true,
        description: "",
      },
      {
        id: "3",
        userId: "u3",
        phaseId: "p",
        sourceType: "match",
        sourceId: "m3",
        points: 10,
        exactHit: false,
        outcomeHit: true,
        description: "",
      },
    ];

    const leaderboard = buildLeaderboardEntries(profiles, entries);

    expect(leaderboard.map((entry) => entry.userId)).toEqual([
      "u1",
      "u2",
      "u3",
    ]);
    expect(leaderboard.map((entry) => entry.position)).toEqual([1, 2, 2]);
  });

  it("compares live ranking against standings without in-progress matches", () => {
    const snapshot: AppSnapshot = {
      competition: {
        id: "world-cup",
        name: "World Cup",
        edition: "2026",
        host: "Test",
      },
      teams: [],
      phases: [],
      rules: [
        {
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
        },
      ],
      matches: [
        {
          id: "match-live",
          phaseId: "phase-1",
          roundLabel: "Round 1",
          kickoffAt: "2026-06-12T20:00:00.000Z",
          venue: "Test",
          status: "in_progress",
        },
      ],
      results: [
        {
          matchId: "match-live",
          homeScore: 2,
          awayScore: 1,
          publishedAt: "2026-06-12T20:30:00.000Z",
        },
      ],
      placementResult: {
        competitionId: "world-cup",
      },
      profiles: [
        {
          id: "u1",
          fullName: "Ana",
          email: "ana@test.dev",
          role: "member",
          createdAt: "2026-01-01T10:00:00.000Z",
        },
        {
          id: "u2",
          fullName: "Bruno",
          email: "bruno@test.dev",
          role: "member",
          createdAt: "2026-01-01T11:00:00.000Z",
        },
      ],
      accessInvites: [],
      signupRequests: [],
      memberships: [
        {
          id: "membership-1",
          userId: "u1",
          competitionId: "world-cup",
          role: "member",
          joinedAt: "2026-01-01T10:00:00.000Z",
        },
        {
          id: "membership-2",
          userId: "u2",
          competitionId: "world-cup",
          role: "member",
          joinedAt: "2026-01-01T11:00:00.000Z",
        },
      ],
      matchPredictions: [
        {
          id: "prediction-1",
          userId: "u1",
          matchId: "match-live",
          homeScore: 0,
          awayScore: 0,
          createdAt: "",
          updatedAt: "",
        },
        {
          id: "prediction-2",
          userId: "u2",
          matchId: "match-live",
          homeScore: 2,
          awayScore: 1,
          createdAt: "",
          updatedAt: "",
        },
      ],
      placementPredictions: [],
    };

    const movements = buildLiveLeaderboardMovements(
      snapshot,
      new Date("2026-06-12T20:31:00.000Z"),
    );

    expect(movements.get("u2")).toBeUndefined();
    expect(movements.get("u1")?.positionDelta).toBe(-1);
  });
});
