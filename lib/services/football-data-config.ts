import "server-only";

import { format } from "date-fns";

export interface FootballDataConfig {
  apiKey: string;
  baseUrl: string;
  competitionId: number;
  cronSecret?: string;
}

export function getFootballDataConfig(): FootballDataConfig | null {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY ?? process.env.API_FOOTBALL_KEY;

  if (!apiKey) {
    return null;
  }

  return {
    apiKey,
    baseUrl: process.env.FOOTBALL_DATA_BASE_URL ?? "https://api.football-data.org/v4",
    competitionId: Number(process.env.FOOTBALL_DATA_COMPETITION_ID ?? 2000),
    cronSecret: process.env.INTERNAL_CRON_SECRET,
  };
}

export function isFootballDataConfigured() {
  return getFootballDataConfig() !== null;
}

export function getTodayForFootballData() {
  return format(new Date(), "yyyy-MM-dd");
}
