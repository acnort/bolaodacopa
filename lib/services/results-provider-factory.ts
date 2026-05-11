import "server-only";

import { apiFootballProvider } from "@/lib/services/api-football-provider";
import { isApiFootballConfigured } from "@/lib/services/api-football-config";
import { footballDataProvider } from "@/lib/services/football-data-provider";
import { isFootballDataConfigured } from "@/lib/services/football-data-config";
import { mockResultsProvider } from "@/lib/services/mock-results-provider";
import type { ResultsProviderName } from "@/lib/services/results-provider";

export function getResultsProvider() {
  if (isFootballDataConfigured()) return footballDataProvider;
  if (isApiFootballConfigured()) return apiFootballProvider;
  if (process.env.NODE_ENV !== "production") return mockResultsProvider;

  throw new Error("API de resultados não configurada.");
}

export function getResultsProviderName(): ResultsProviderName {
  if (isFootballDataConfigured()) return "football-data";
  if (isApiFootballConfigured()) return "api-football";
  return process.env.NODE_ENV === "production" ? "unconfigured" : "mock";
}
