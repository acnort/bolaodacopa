import { afterEach, describe, expect, it, vi } from "vitest";

import { footballDataProvider } from "@/lib/services/football-data-provider";

describe("football-data provider", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  function configureFootballData() {
    vi.stubEnv("FOOTBALL_DATA_API_KEY", "test-key");
    vi.stubEnv("FOOTBALL_DATA_COMPETITION_ID", "2000");
    vi.stubEnv("FOOTBALL_DATA_BASE_URL", "https://api.example.test");
  }

  it("scores penalty shootout matches by regular time and stores full-time total", async () => {
    configureFootballData();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            matches: [
              {
                id: 537418,
                utcDate: "2026-06-30T01:00:00Z",
                status: "FINISHED",
                stage: "LAST_32",
                homeTeam: { id: 8601, name: "Netherlands", tla: "NED" },
                awayTeam: { id: 815, name: "Morocco", tla: "MAR" },
                score: {
                  winner: "AWAY_TEAM",
                  duration: "PENALTY_SHOOTOUT",
                  fullTime: { home: 3, away: 4 },
                  halfTime: { home: 0, away: 0 },
                  regularTime: { home: 1, away: 1 },
                  extraTime: { home: 0, away: 0 },
                  penalties: { home: 2, away: 3 },
                },
              },
            ],
          }),
          { status: 200 },
        ),
      ),
    );

    const results = await footballDataProvider.getResults();

    expect(results[0]).toMatchObject({
      matchId: "537418",
      homeScore: 1,
      awayScore: 1,
      totalHomeScore: 3,
      totalAwayScore: 4,
    });
  });

  it("does not score non-regular completed matches without regular-time score", async () => {
    configureFootballData();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            matches: [
              {
                id: 537419,
                utcDate: "2026-06-30T01:00:00Z",
                status: "FINISHED",
                stage: "LAST_32",
                homeTeam: { id: 8601, name: "Netherlands", tla: "NED" },
                awayTeam: { id: 815, name: "Morocco", tla: "MAR" },
                score: {
                  duration: "PENALTY_SHOOTOUT",
                  fullTime: { home: 3, away: 4 },
                  halfTime: { home: 0, away: 0 },
                },
              },
            ],
          }),
          { status: 200 },
        ),
      ),
    );

    await expect(footballDataProvider.getResults()).resolves.toEqual([]);
  });
});
