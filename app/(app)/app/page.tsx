import { RankingView } from "@/components/ranking-view";
import { getPublicRankingSnapshot } from "@/lib/services/app-service";

export default async function AppHomePage() {
  const visibleAt = new Date();
  const snapshot = await getPublicRankingSnapshot(visibleAt);

  return (
    <RankingView snapshot={snapshot} visibleAt={visibleAt.toISOString()} />
  );
}
