import { PredictionsPageClient } from "@/components/predictions-page-client";
import {
  getCurrentUserId,
  getCurrentUserPredictionsSnapshot,
} from "@/lib/services/app-service";

export default async function PredictionsPage({
  searchParams,
}: {
  searchParams: Promise<{ phase?: string }>;
}) {
  const visibleAt = new Date();
  const snapshot = await getCurrentUserPredictionsSnapshot();
  const currentUserId = await getCurrentUserId();
  const { phase: phaseSlug } = await searchParams;

  return (
    <PredictionsPageClient
      snapshot={snapshot}
      currentUserId={currentUserId}
      phaseSlug={phaseSlug}
      visibleAt={visibleAt.toISOString()}
    />
  );
}
