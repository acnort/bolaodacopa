import "server-only";

import type { Match, OfficialResult } from "@/lib/domain/types";
import { worldCup2026Teams } from "@/lib/data/world-cup-2026";
import {
  type ResultsProvider,
  type ResultsSyncOptions,
} from "@/lib/services/results-provider";
import {
  getFootballDataConfig,
  getTodayForFootballData,
} from "@/lib/services/football-data-config";

interface FootballDataMatchesResponse {
  resultSet?: {
    first?: string;
    last?: string;
    count?: number;
  };
  matches: Array<{
    id: number;
    utcDate: string;
    status: string;
    stage: string;
    group?: string | null;
    homeTeam: {
      id?: number | null;
      name?: string | null;
      tla?: string | null;
    };
    awayTeam: {
      id?: number | null;
      name?: string | null;
      tla?: string | null;
    };
    score: {
      duration?: string;
      fullTime: {
        home: number | null;
        away: number | null;
      };
      regularTime?: {
        home: number | null;
        away: number | null;
      };
      extraTime?: {
        home: number | null;
        away: number | null;
      };
      penalties?: {
        home: number | null;
        away: number | null;
      };
    };
  }>;
}

const teamAliases: Record<string, string> = {
  algeria: "Argélia",
  australia: "Austrália",
  austria: "Áustria",
  belgium: "Bélgica",
  "bosnia and herzegovina": "Bósnia e Herzegovina",
  "bosnia-herzegovina": "Bósnia e Herzegovina",
  brazil: "Brasil",
  canada: "Canadá",
  "cape verde": "Cabo Verde",
  "cape verde islands": "Cabo Verde",
  colombia: "Colômbia",
  croatia: "Croácia",
  "côte d'ivoire": "Costa do Marfim",
  czechia: "República Tcheca",
  "czech republic": "República Tcheca",
  curaçao: "Curaçao",
  curacao: "Curaçao",
  "dr congo": "República Democrática do Congo",
  "congo dr": "República Democrática do Congo",
  ecuador: "Equador",
  egypt: "Egito",
  england: "Inglaterra",
  france: "França",
  germany: "Alemanha",
  ghana: "Gana",
  iran: "Irã",
  iraq: "Iraque",
  "ivory coast": "Costa do Marfim",
  japan: "Japão",
  jordan: "Jordânia",
  "korea republic": "Coreia do Sul",
  mexico: "México",
  morocco: "Marrocos",
  netherlands: "Países Baixos",
  "new zealand": "Nova Zelândia",
  norway: "Noruega",
  panama: "Panamá",
  paraguay: "Paraguai",
  qatar: "Catar",
  scotland: "Escócia",
  "saudi arabia": "Arábia Saudita",
  "south africa": "África do Sul",
  "south korea": "Coreia do Sul",
  spain: "Espanha",
  sweden: "Suécia",
  switzerland: "Suíça",
  tunisia: "Tunísia",
  turkey: "Turquia",
  uruguay: "Uruguai",
  usa: "Estados Unidos",
  "united states": "Estados Unidos",
  uzbekistan: "Uzbequistão",
};

function normalizeTeamName(name?: string | null) {
  return name?.trim().toLowerCase() ?? "";
}

function getInternalTeamId(name?: string | null, tla?: string | null) {
  const normalizedName = normalizeTeamName(name);
  const aliasedName = teamAliases[normalizedName] ?? name;
  const normalizedAlias = normalizeTeamName(aliasedName);
  const normalizedTla = tla?.trim().toUpperCase();

  return worldCup2026Teams.find(
    (team) =>
      normalizeTeamName(team.name) === normalizedAlias ||
      team.code === normalizedTla ||
      team.shortName === normalizedTla,
  )?.id;
}

function toMatchStatus(status: string): Match["status"] {
  if (status === "FINISHED") return "completed";
  if (["IN_PLAY", "PAUSED", "LIVE"].includes(status)) return "in_progress";
  return "scheduled";
}

function toPhaseId(stage: string) {
  if (stage === "GROUP_STAGE") return "phase-groups";
  if (stage === "LAST_32") return "phase-round-32";
  if (stage === "LAST_16") return "phase-round-16";
  if (stage === "QUARTER_FINALS") return "phase-quarterfinals";
  if (stage === "SEMI_FINALS") return "phase-semifinals";
  if (stage === "FINAL") return "phase-final";
  if (stage === "THIRD_PLACE") return "phase-final";
  return "football-data-sync";
}

function toRoundLabel(stage: string) {
  if (stage === "GROUP_STAGE") return "Fase de grupos";
  if (stage === "LAST_32") return "16-avos";
  if (stage === "LAST_16") return "Oitavas";
  if (stage === "QUARTER_FINALS") return "Quartas";
  if (stage === "SEMI_FINALS") return "Semifinal";
  if (stage === "FINAL") return "Final";
  if (stage === "THIRD_PLACE") return "Terceiro lugar";
  return stage;
}

async function fetchMatches(path: string) {
  const config = getFootballDataConfig();
  if (!config) {
    throw new Error("football-data.org não configurada.");
  }

  const response = await fetch(`${config.baseUrl}${path}`, {
    headers: {
      "X-Auth-Token": config.apiKey,
    },
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    let details = "";
    try {
      const payload = (await response.json()) as { message?: string };
      details = payload.message ? `: ${payload.message}` : "";
    } catch {
      details = "";
    }

    throw new Error(`football-data.org respondeu com ${response.status}${details}`);
  }

  return (await response.json()) as FootballDataMatchesResponse;
}

function buildMatchesPath(options?: ResultsSyncOptions) {
  const config = getFootballDataConfig();
  if (!config) {
    throw new Error("football-data.org não configurada.");
  }

  const params = new URLSearchParams();
  if (options?.date) {
    params.set("dateFrom", options.date);
    params.set("dateTo", options.date);
  }

  const query = params.toString();
  return `/competitions/${config.competitionId}/matches${query ? `?${query}` : ""}`;
}

function mapMatch(match: FootballDataMatchesResponse["matches"][number]): Match {
  const homeTeamId = getInternalTeamId(match.homeTeam.name, match.homeTeam.tla);
  const awayTeamId = getInternalTeamId(match.awayTeam.name, match.awayTeam.tla);

  return {
    id: String(match.id),
    externalMatchId: String(match.id),
    phaseId: toPhaseId(match.stage),
    roundLabel: toRoundLabel(match.stage),
    stageGroup: match.group?.replace("GROUP_", "Grupo ") ?? undefined,
    kickoffAt: match.utcDate,
    venue: "A definir",
    homeTeamId,
    awayTeamId,
    homePlaceholder: homeTeamId ? undefined : (match.homeTeam.name ?? "A definir"),
    awayPlaceholder: awayTeamId ? undefined : (match.awayTeam.name ?? "A definir"),
    status: toMatchStatus(match.status),
  };
}

function mapResult(
  match: FootballDataMatchesResponse["matches"][number],
): OfficialResult | null {
  const regularTime = match.score.regularTime;
  const hasRegularTime =
    regularTime?.home !== null &&
    regularTime?.home !== undefined &&
    regularTime.away !== null &&
    regularTime.away !== undefined;
  const isCompleted = toMatchStatus(match.status) === "completed";
  const isNonRegularCompleted =
    isCompleted &&
    match.score.duration !== undefined &&
    match.score.duration !== "REGULAR";

  if (isNonRegularCompleted && !hasRegularTime) {
    return null;
  }

  const homeScore = hasRegularTime
    ? regularTime.home
    : match.score.fullTime.home;
  const awayScore = hasRegularTime
    ? regularTime.away
    : match.score.fullTime.away;

  if (homeScore === null || awayScore === null) {
    return null;
  }

  const totalHomeScore = match.score.fullTime.home;
  const totalAwayScore = match.score.fullTime.away;

  return {
    matchId: String(match.id),
    homeScore,
    awayScore,
    totalHomeScore: totalHomeScore ?? undefined,
    totalAwayScore: totalAwayScore ?? undefined,
    publishedAt: new Date().toISOString(),
  };
}

export const footballDataProvider: ResultsProvider = {
  async getMatchData(options?: ResultsSyncOptions) {
    const payload = await fetchMatches(buildMatchesPath(options));
    return {
      matches: payload.matches.map(mapMatch),
      results: payload.matches.map(mapResult).filter(Boolean) as OfficialResult[],
      externalCalls: 1,
    };
  },

  async listMatches(options?: ResultsSyncOptions) {
    const payload = await fetchMatches(buildMatchesPath(options));
    return payload.matches.map(mapMatch);
  },

  async getResults(options?: ResultsSyncOptions) {
    const payload = await fetchMatches(buildMatchesPath(options));
    return payload.matches.map(mapResult).filter(Boolean) as OfficialResult[];
  },

  async syncCompetitionData(options?: ResultsSyncOptions) {
    const data = await this.getMatchData!(options);

    return {
      syncedAt: new Date().toISOString(),
      matches: data.matches.length,
      results: data.results.length,
      provider: "football-data",
      mode: options?.mode ?? "daily",
      date: options?.date ?? getTodayForFootballData(),
      fallbackAdminManual: true,
      externalCalls: data.externalCalls,
    };
  },
};
