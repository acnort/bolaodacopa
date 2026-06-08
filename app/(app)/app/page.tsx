import { RankingView } from "@/components/ranking-view";
import { getAppSnapshot } from "@/lib/services/app-service";

export default async function AppHomePage() {
  const snapshot = await getAppSnapshot();

  return (
    <RankingView snapshot={snapshot} visibleAt={new Date().toISOString()} />
  );
}
