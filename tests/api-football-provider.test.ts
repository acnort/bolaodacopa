import { afterEach, describe, expect, it, vi } from "vitest";

import { apiFootballProvider } from "@/lib/services/api-football-provider";

describe("api-football provider", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("fetches the full season when sync has no explicit date", async () => {
    vi.stubEnv("API_FOOTBALL_KEY", "test-key");
    vi.stubEnv("API_FOOTBALL_LEAGUE_ID", "1");
    vi.stubEnv("API_FOOTBALL_SEASON", "2026");
    vi.stubEnv("API_FOOTBALL_BASE_URL", "https://api.example.test");
    vi.stubEnv("API_FOOTBALL_TIMEZONE", "America/Sao_Paulo");

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          response: [
            {
              fixture: {
                id: 123,
                date: "2026-06-19T22:00:00+00:00",
                venue: { name: "Toronto" },
                status: { short: "NS" },
              },
              league: { round: "Rodada 2" },
              teams: {
                home: { id: 10, name: "Brasil" },
                away: { id: 20, name: "Marrocos" },
              },
              goals: { home: null, away: null },
            },
          ],
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const data = await apiFootballProvider.getMatchData!({ mode: "adaptive" });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/fixtures?league=1&season=2026&timezone=America%2FSao_Paulo",
      {
        headers: { "x-apisports-key": "test-key" },
        next: { revalidate: 0 },
      },
    );
    expect(data.matches[0]).toMatchObject({
      externalMatchId: "123",
      kickoffAt: "2026-06-19T22:00:00+00:00",
    });
  });

  it("keeps date-limited sync scoped to one day", async () => {
    vi.stubEnv("API_FOOTBALL_KEY", "test-key");
    vi.stubEnv("API_FOOTBALL_LEAGUE_ID", "1");
    vi.stubEnv("API_FOOTBALL_SEASON", "2026");
    vi.stubEnv("API_FOOTBALL_BASE_URL", "https://api.example.test");
    vi.stubEnv("API_FOOTBALL_TIMEZONE", "America/Sao_Paulo");
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ response: [] }), { status: 200 }),
        ),
    );

    await apiFootballProvider.getMatchData!({ date: "2026-06-19" });

    expect(fetch).toHaveBeenCalledWith(
      "https://api.example.test/fixtures?league=1&season=2026&date=2026-06-19&timezone=America%2FSao_Paulo",
      expect.any(Object),
    );
  });
});
