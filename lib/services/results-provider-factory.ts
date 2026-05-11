import "server-only";

import { apiFootballProvider } from "@/lib/services/api-football-provider";
import { isApiFootballConfigured } from "@/lib/services/api-football-config";
import { footballDataProvider } from "@/lib/services/football-data-provider";
import { isFootballDataConfigured } from "@/lib/services/football-data-config";
import { mockResultsProvider } from "@/lib/services/mock-results-provider";

export function getResultsProvider() {
  if (isFootballDataConfigured()) return footballDataProvider;
  return isApiFootballConfigured() ? apiFootballProvider : mockResultsProvider;
}

export function getResultsProviderName() {
  if (isFootballDataConfigured()) return "football-data";
  if (isApiFootballConfigured()) return "api-football";
  return "mock";
}
