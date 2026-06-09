import { ResultsPageClient } from "@/components/results-page-client";
import { getPublicResultsSnapshot } from "@/lib/services/app-service";

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ phase?: string }>;
}) {
  const snapshot = await getPublicResultsSnapshot();
  const { phase: phaseSlug } = await searchParams;

  return <ResultsPageClient snapshot={snapshot} phaseSlug={phaseSlug} />;
}
