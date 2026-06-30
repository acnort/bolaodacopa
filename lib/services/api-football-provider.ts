import "server-only";

import type { Match, OfficialResult } from "@/lib/domain/types";
import {
  type ResultsProvider,
  type ResultsSyncOptions,
} from "@/lib/services/results-provider";
import {
  getApiFootballConfig,
  getTodayInSyncTimezone,
} from "@/lib/services/api-football-config";

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
    score?: {
      fulltime?: {
        home: number | null;
        away: number | null;
      };
      extratime?: {
        home: number | null;
        away: number | null;
      };
      penalty?: {
        home: number | null;
        away: number | null;
      };
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

async function fetchSeasonFixtures() {
  const config = getApiFootballConfig();
  if (!config) {
    throw new Error("API-Football não configurada.");
  }

  return fetchFixtures(
    `/fixtures?league=${config.leagueId}&season=${config.season}&timezone=${encodeURIComponent(config.timezone)}`,
  );
}

async function fetchLiveFixtures() {
  const config = getApiFootballConfig();
  if (!config) {
    throw new Error("API-Football não configurada.");
  }

  return fetchFixtures(
    `/fixtures?live=${config.leagueId}&timezone=${encodeURIComponent(config.timezone)}`,
  );
}

function mapFixtureToMatch(
  fixture: ApiFootballFixtureResponse["response"][number],
): Match {
  return {
    id: String(fixture.fixture.id),
    externalMatchId: String(fixture.fixture.id),
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
  const isCompleted =
    toMatchStatus(fixture.fixture.status.short) === "completed";
  const homeScore =
    fixture.score?.fulltime?.home ?? (isCompleted ? null : fixture.goals.home);
  const awayScore =
    fixture.score?.fulltime?.away ?? (isCompleted ? null : fixture.goals.away);

  if (homeScore === null || awayScore === null) {
    return null;
  }

  const extraTimeScore =
    fixture.score?.extratime?.home !== null &&
    fixture.score?.extratime?.home !== undefined &&
    fixture.score.extratime.away !== null &&
    fixture.score.extratime.away !== undefined
      ? {
          home: homeScore + fixture.score.extratime.home,
          away: awayScore + fixture.score.extratime.away,
        }
      : undefined;
  const penaltyScore =
    fixture.score?.penalty?.home !== null &&
    fixture.score?.penalty?.home !== undefined &&
    fixture.score.penalty.away !== null &&
    fixture.score.penalty.away !== undefined &&
    fixture.goals.home !== null &&
    fixture.goals.away !== null
      ? {
          home: fixture.goals.home,
          away: fixture.goals.away,
        }
      : undefined;

  return {
    matchId: String(fixture.fixture.id),
    homeScore,
    awayScore,
    totalHomeScore: fixture.goals.home ?? undefined,
    totalAwayScore: fixture.goals.away ?? undefined,
    extraTimeHomeScore: extraTimeScore?.home,
    extraTimeAwayScore: extraTimeScore?.away,
    penaltyHomeScore: penaltyScore?.home,
    penaltyAwayScore: penaltyScore?.away,
    publishedAt: new Date().toISOString(),
  };
}

export const apiFootballProvider: ResultsProvider = {
  async getMatchData(options?: ResultsSyncOptions) {
    const payload = options?.date
      ? await fetchFixturesByDate(options.date)
      : await fetchSeasonFixtures();

    return {
      matches: payload.response.map(mapFixtureToMatch),
      results: payload.response
        .map(mapFixtureToResult)
        .filter(Boolean) as OfficialResult[],
      externalCalls: 1,
    };
  },

  async listMatches(options?: ResultsSyncOptions) {
    const payload = options?.date
      ? await fetchFixturesByDate(options.date)
      : await fetchSeasonFixtures();
    return payload.response.map(mapFixtureToMatch);
  },

  async getResults(options?: ResultsSyncOptions) {
    const payload = options?.date
      ? await fetchFixturesByDate(options.date)
      : await fetchSeasonFixtures();
    return payload.response
      .map(mapFixtureToResult)
      .filter(Boolean) as OfficialResult[];
  },

  async syncCompetitionData(options?: ResultsSyncOptions) {
    const mode = options?.mode ?? "daily";
    const payload = options?.date
      ? await fetchFixturesByDate(options.date)
      : mode === "live-window"
        ? await fetchLiveFixtures()
        : await fetchSeasonFixtures();

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
      date: options?.date ?? getTodayInSyncTimezone(),
      fallbackAdminManual: true,
    };
  },
};
