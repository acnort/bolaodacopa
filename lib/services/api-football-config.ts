import "server-only";

import { format } from "date-fns";

export interface ApiFootballConfig {
  apiKey: string;
  baseUrl: string;
  leagueId: number;
  season: number;
  timezone: string;
  cronSecret?: string;
}

export function getApiFootballConfig(): ApiFootballConfig | null {
  const apiKey = process.env.API_FOOTBALL_KEY;
  const leagueId = process.env.API_FOOTBALL_LEAGUE_ID;
  const season = process.env.API_FOOTBALL_SEASON;

  if (!apiKey || !leagueId || !season) {
    return null;
  }

  return {
    apiKey,
    baseUrl: process.env.API_FOOTBALL_BASE_URL ?? "https://v3.football.api-sports.io",
    leagueId: Number(leagueId),
    season: Number(season),
    timezone: process.env.API_FOOTBALL_TIMEZONE ?? "America/Sao_Paulo",
    cronSecret: process.env.INTERNAL_CRON_SECRET,
  };
}

export function isApiFootballConfigured() {
  return getApiFootballConfig() !== null;
}

export function getTodayInSyncTimezone() {
  return format(new Date(), "yyyy-MM-dd");
}
