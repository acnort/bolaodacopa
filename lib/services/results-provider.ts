import type { Match, OfficialResult } from "@/lib/domain/types";

export interface ResultsSyncOptions {
  mode?: "daily" | "live-window";
  date?: string;
}

export interface ResultsSyncSummary {
  syncedAt: string;
  matches: number;
  results: number;
  provider: "mock" | "api-football";
  mode: "daily" | "live-window";
  date?: string;
  fallbackAdminManual: boolean;
}

export interface ResultsProvider {
  listMatches(): Promise<Match[]>;
  getResults(): Promise<OfficialResult[]>;
  syncCompetitionData(options?: ResultsSyncOptions): Promise<ResultsSyncSummary>;
}
