import "server-only";

import { apiFootballProvider } from "@/lib/services/api-football-provider";
import { isApiFootballConfigured } from "@/lib/services/api-football-config";
import { mockResultsProvider } from "@/lib/services/mock-results-provider";

export function getResultsProvider() {
  return isApiFootballConfigured() ? apiFootballProvider : mockResultsProvider;
}
