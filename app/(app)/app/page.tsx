import { RankingView } from "@/components/ranking-view";
import {
  getCurrentUserPredictionsSnapshot,
  getPublicRankingSnapshot,
  getResultsLastUpdatedAt,
} from "@/lib/services/app-service";

export default async function AppHomePage() {
  const visibleAt = new Date();
  const [snapshot, currentUserPredictions, resultsLastUpdatedAt] =
    await Promise.all([
      getPublicRankingSnapshot(visibleAt),
      getCurrentUserPredictionsSnapshot(),
      getResultsLastUpdatedAt(),
    ]);

  return (
    <RankingView
      snapshot={snapshot}
      currentUserMatchPredictions={currentUserPredictions.matchPredictions}
      visibleAt={visibleAt.toISOString()}
      resultsLastUpdatedAt={resultsLastUpdatedAt}
    />
  );
}
