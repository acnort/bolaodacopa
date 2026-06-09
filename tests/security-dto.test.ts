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

import { resetDemoStore } from "@/lib/services/demo-store";
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

  it("does not expose match predictions before results are public", async () => {
    const snapshot = await getPublicRankingSnapshot(new Date("2026-01-01"));

    expect(snapshot.matchPredictions).toHaveLength(0);
    expect(snapshot.placementPredictions).toHaveLength(0);
  });
});
