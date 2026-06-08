import { beforeEach, describe, expect, it } from "vitest";

import {
  activateSignupRequestDemo,
  getDemoSnapshot,
  resetDemoStore,
  reviewSignupRequestDemo,
  saveMatchPredictionDemo,
  savePhaseRuleDemo,
} from "@/lib/services/demo-store";
import { buildLeaderboard } from "@/lib/domain/scoring";

describe("demo store", () => {
  beforeEach(() => {
    resetDemoStore();
  });

  it("updates an existing match prediction", () => {
    const result = saveMatchPredictionDemo({
      userId: "user-ana",
      matchId: "match-1",
      homeScore: 4,
      awayScore: 0,
    });

    expect(result.ok).toBe(true);
    expect(
      getDemoSnapshot().matchPredictions.find(
        (prediction) =>
          prediction.userId === "user-ana" && prediction.matchId === "match-1",
      )?.homeScore,
    ).toBe(4);
  });

  it("updates phase scoring rules", () => {
    const result = savePhaseRuleDemo({
      phaseId: "phase-groups",
      enableMatchPredictions: true,
      enablePlacementPredictions: false,
      opensAt: "2026-06-10T00:00",
      closesAt: "2026-06-30T23:59",
      exactScore: 9,
      correctOutcome: 3,
      champion: 0,
      runnerUp: 0,
      thirdPlace: 0,
      status: "active",
    });

    expect(result.ok).toBe(true);
    expect(
      getDemoSnapshot().rules.find((rule) => rule.phaseId === "phase-groups")
        ?.scoring.exactScore,
    ).toBe(9);
  });

  it("keeps invite signups pending until admin approval", () => {
    const result = activateSignupRequestDemo({
      token: "convite-bolao-2026",
      fullName: "Gustavo Cassiraghi",
      email: "gustavo@example.com",
      passwordHash: "hashed-password",
    });

    expect(result.ok).toBe(true);
    expect(result.data?.requiresApproval).toBe(true);

    const pendingSnapshot = getDemoSnapshot();
    const profile = pendingSnapshot.profiles.find(
      (item) => item.email === "gustavo@example.com",
    );
    const request = pendingSnapshot.signupRequests.find(
      (item) => item.email === "gustavo@example.com",
    );

    expect(profile?.role).toBe("member");
    expect(request?.status).toBe("pending");
    expect(
      pendingSnapshot.memberships.some(
        (membership) => membership.userId === profile?.id,
      ),
    ).toBe(false);
    expect(
      buildLeaderboard(pendingSnapshot).some(
        (entry) => entry.userId === profile?.id,
      ),
    ).toBe(false);

    const approval = reviewSignupRequestDemo({
      requestId: request!.id,
      action: "approve",
    });

    expect(approval.ok).toBe(true);

    const approvedSnapshot = getDemoSnapshot();
    expect(
      approvedSnapshot.memberships.some(
        (membership) =>
          membership.userId === profile?.id && membership.role === "member",
      ),
    ).toBe(true);
    expect(
      approvedSnapshot.signupRequests.find((item) => item.id === request!.id)
        ?.status,
    ).toBe("approved");
    expect(
      buildLeaderboard(approvedSnapshot).some(
        (entry) => entry.userId === profile?.id,
      ),
    ).toBe(true);
  });
});
