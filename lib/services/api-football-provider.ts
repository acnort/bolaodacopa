import "server-only";

import type { Match, OfficialResult } from "@/lib/domain/types";
import { type ResultsProvider, type ResultsSyncOptions } from "@/lib/services/results-provider";
import { getApiFootballConfig, getTodayInSyncTimezone } from "@/lib/services/api-football-config";

interface ApiFootballFixtureResponse {
  response: Array<{
    fixture: {
      id: number;
      date: string;
      venue?: {
        name?: string | null;
      } | null;
      status: {
        short: string;
      };
    };
    league: {
      round?: string;
    };
    teams: {
      home: { id: number; name: string };
      away: { id: number; name: string };
    };
    goals: {
      home: number | null;
      away: number | null;
    };
  }>;
}

function toMatchStatus(status: string): Match["status"] {
  if (["FT", "AET", "PEN"].includes(status)) return "completed";
  if (["1H", "HT", "2H", "ET", "BT", "P", "INT", "LIVE"].includes(status)) {
    return "in_progress";
  }
  return "scheduled";
}

async function fetchFixtures(path: string) {
  const config = getApiFootballConfig();
  if (!config) {
    throw new Error("API-Football não configurada.");
  }

  const response = await fetch(`${config.baseUrl}${path}`, {
    headers: {
      "x-apisports-key": config.apiKey,
    },
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(`API-Football respondeu com ${response.status}.`);
  }

  return (await response.json()) as ApiFootballFixtureResponse;
}

async function fetchFixturesByDate(date: string) {
  const config = getApiFootballConfig();
  if (!config) {
    throw new Error("API-Football não configurada.");
  }

  return fetchFixtures(
    `/fixtures?league=${config.leagueId}&season=${config.season}&date=${date}&timezone=${encodeURIComponent(config.timezone)}`,
  );
}

async function fetchLiveFixtures() {
  const config = getApiFootballConfig();
  if (!config) {
    throw new Error("API-Football não configurada.");
  }

  return fetchFixtures(`/fixtures?live=${config.leagueId}&timezone=${encodeURIComponent(config.timezone)}`);
}

function mapFixtureToMatch(
  fixture: ApiFootballFixtureResponse["response"][number],
): Match {
  return {
    id: String(fixture.fixture.id),
    phaseId: "api-football-sync",
    roundLabel: fixture.league.round ?? "Rodada",
    kickoffAt: fixture.fixture.date,
    venue: fixture.fixture.venue?.name ?? "A definir",
    homeTeamId: String(fixture.teams.home.id),
    awayTeamId: String(fixture.teams.away.id),
    status: toMatchStatus(fixture.fixture.status.short),
  };
}

function mapFixtureToResult(
  fixture: ApiFootballFixtureResponse["response"][number],
): OfficialResult | null {
  if (fixture.goals.home === null || fixture.goals.away === null) {
    return null;
  }

  return {
    matchId: String(fixture.fixture.id),
    homeScore: fixture.goals.home,
    awayScore: fixture.goals.away,
    publishedAt: new Date().toISOString(),
  };
}

export const apiFootballProvider: ResultsProvider = {
  async getMatchData(options?: ResultsSyncOptions) {
    const daily = await fetchFixturesByDate(options?.date ?? getTodayInSyncTimezone());
    return {
      matches: daily.response.map(mapFixtureToMatch),
      results: daily.response.map(mapFixtureToResult).filter(Boolean) as OfficialResult[],
      externalCalls: 1,
    };
  },

  async listMatches(options?: ResultsSyncOptions) {
    const daily = await fetchFixturesByDate(options?.date ?? getTodayInSyncTimezone());
    return daily.response.map(mapFixtureToMatch);
  },

  async getResults(options?: ResultsSyncOptions) {
    const daily = await fetchFixturesByDate(options?.date ?? getTodayInSyncTimezone());
    return daily.response.map(mapFixtureToResult).filter(Boolean) as OfficialResult[];
  },

  async syncCompetitionData(options?: ResultsSyncOptions) {
    const mode = options?.mode ?? "daily";
    const date = options?.date ?? getTodayInSyncTimezone();
    const payload =
      mode === "live-window"
        ? await fetchLiveFixtures()
        : await fetchFixturesByDate(date);

    const matches = payload.response.map(mapFixtureToMatch);
    const results = payload.response
      .map(mapFixtureToResult)
      .filter(Boolean) as OfficialResult[];

    return {
      syncedAt: new Date().toISOString(),
      matches: matches.length,
      results: results.length,
      provider: "api-football" as const,
      mode,
      date,
      fallbackAdminManual: true,
    };
  },
};
