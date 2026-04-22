import { describe, expect, it } from "vitest";

import { buildLeaderboardEntries } from "@/lib/domain/scoring";
import type { Profile, ScoreEntry } from "@/lib/domain/types";

describe("ranking tiebreakers", () => {
  it("sorts by points, then exact hits, then outcome hits, then profile creation date", () => {
    const profiles: Profile[] = [
      { id: "u1", fullName: "Ana", email: "ana@test.dev", role: "member", createdAt: "2026-01-01T10:00:00.000Z" },
      { id: "u2", fullName: "Bruno", email: "bruno@test.dev", role: "member", createdAt: "2026-01-01T11:00:00.000Z" },
      { id: "u3", fullName: "Carla", email: "carla@test.dev", role: "member", createdAt: "2026-01-01T12:00:00.000Z" },
    ];

    const entries: ScoreEntry[] = [
      { id: "1", userId: "u1", phaseId: "p", sourceType: "match", sourceId: "m1", points: 10, exactHit: true, outcomeHit: true, description: "" },
      { id: "2", userId: "u2", phaseId: "p", sourceType: "match", sourceId: "m2", points: 10, exactHit: false, outcomeHit: true, description: "" },
      { id: "3", userId: "u3", phaseId: "p", sourceType: "match", sourceId: "m3", points: 10, exactHit: false, outcomeHit: true, description: "" },
    ];

    const leaderboard = buildLeaderboardEntries(profiles, entries);

    expect(leaderboard.map((entry) => entry.userId)).toEqual(["u1", "u2", "u3"]);
  });
});
