import { sampleSnapshot } from "@/lib/data/sample-data";
import type { ResultsProvider } from "@/lib/services/results-provider";

export const mockResultsProvider: ResultsProvider = {
  async getMatchData() {
    return {
      matches: structuredClone(sampleSnapshot.matches),
      results: structuredClone(sampleSnapshot.results),
      externalCalls: 0,
    };
  },

  async listMatches() {
    return structuredClone(sampleSnapshot.matches);
  },
  async getResults() {
    return structuredClone(sampleSnapshot.results);
  },
  async syncCompetitionData(options) {
    return {
      syncedAt: new Date().toISOString(),
      matches: sampleSnapshot.matches.length,
      results: sampleSnapshot.results.length,
      provider: "mock",
      mode: options?.mode ?? "daily",
      date: options?.date,
      fallbackAdminManual: true,
    };
  },
};
