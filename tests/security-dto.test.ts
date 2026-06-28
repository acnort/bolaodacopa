import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({
  unstable_noStore: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}));

import {
  resetDemoStore,
  saveMatchPredictionDemo,
} from "@/lib/services/demo-store";
import { getPublicRankingSnapshot } from "@/lib/services/app-service";

describe("security DTOs", () => {
  beforeEach(() => {
    resetDemoStore();
    delete process.env.DATABASE_URL;
  });

  it("does not expose invite or signup tokens in public ranking data", async () => {
    const snapshot = await getPublicRankingSnapshot(new Date("2030-01-01"));

    expect(snapshot.accessInvites).toHaveLength(0);
    expect(snapshot.signupRequests).toHaveLength(0);
    expect(snapshot.profiles.every((profile) => profile.email === "")).toBe(
      true,
    );
  });

  it("does not expose predictions before phase windows close", async () => {
    const snapshot = await getPublicRankingSnapshot(new Date("2026-01-01"));

    expect(snapshot.matchPredictions).toHaveLength(0);
    expect(snapshot.placementPredictions).toHaveLength(0);
  });

  it("exposes placement predictions after the podium window closes", async () => {
    const snapshot = await getPublicRankingSnapshot(
      new Date("2026-06-11T15:00:00.000Z"),
    );

    expect(snapshot.placementPredictions).toHaveLength(3);
    expect(snapshot.matchPredictions).toHaveLength(0);
  });

  it("exposes match predictions only after their phase window closes", async () => {
    const beforeClose = await getPublicRankingSnapshot(
      new Date("2026-06-16T00:00:00.000Z"),
    );
    const afterClose = await getPublicRankingSnapshot(
      new Date("2026-07-01T03:00:00.000Z"),
    );

    expect(beforeClose.matchPredictions).toHaveLength(0);
    expect(afterClose.matchPredictions).toHaveLength(9);
  });

  it("exposes knockout predictions only after each match closes", async () => {
    saveMatchPredictionDemo({
      userId: "user-ana",
      matchId: "round32-1",
      homeScore: 1,
      awayScore: 0,
    });
    saveMatchPredictionDemo({
      userId: "user-ana",
      matchId: "round32-2",
      homeScore: 2,
      awayScore: 1,
    });

    const snapshot = await getPublicRankingSnapshot(
      new Date("2026-07-01T16:00:01.000Z"),
    );
    const round32MatchIds = snapshot.matchPredictions
      .map((prediction) => prediction.matchId)
      .filter((matchId) => matchId.startsWith("round32-"));

    expect(round32MatchIds).toEqual(["round32-1"]);
  });
});
