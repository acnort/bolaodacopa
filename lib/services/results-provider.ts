import type { Match, OfficialResult } from "@/lib/domain/types";

export interface ResultsSyncOptions {
  mode?: "daily" | "live-window" | "adaptive";
  date?: string;
  force?: boolean;
}

export interface ProviderMatchData {
  matches: Match[];
  results: OfficialResult[];
  externalCalls: number;
}

export interface ResultsSyncSummary {
  syncedAt: string;
  matches: number;
  results: number;
  provider: "mock" | "api-football" | "football-data";
  mode: "daily" | "live-window" | "adaptive";
  date?: string;
  fallbackAdminManual: boolean;
  persistedMatches?: number;
  persistedResults?: number;
  unmatchedMatches?: number;
  externalCalls?: number;
  skipped?: boolean;
  skipReason?: string;
  recommendedIntervalSeconds?: number;
  nextRecommendedSyncAt?: string;
}

export interface ResultsProvider {
  listMatches(options?: ResultsSyncOptions): Promise<Match[]>;
  getResults(options?: ResultsSyncOptions): Promise<OfficialResult[]>;
  getMatchData?(options?: ResultsSyncOptions): Promise<ProviderMatchData>;
  syncCompetitionData(options?: ResultsSyncOptions): Promise<ResultsSyncSummary>;
}
