import { RankingView } from "@/components/ranking-view";
import {
  getPublicRankingSnapshot,
  getResultsLastUpdatedAt,
} from "@/lib/services/app-service";

export default async function AppHomePage() {
  const visibleAt = new Date();
  const [snapshot, resultsLastUpdatedAt] = await Promise.all([
    getPublicRankingSnapshot(visibleAt),
    getResultsLastUpdatedAt(),
  ]);

  return (
    <RankingView
      snapshot={snapshot}
      visibleAt={visibleAt.toISOString()}
      resultsLastUpdatedAt={resultsLastUpdatedAt}
    />
  );
}
