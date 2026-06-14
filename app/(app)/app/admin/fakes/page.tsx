import { AdminFakePredictionsManager } from "@/components/admin-fake-predictions-manager";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { getSortedPhases } from "@/lib/domain/selectors";
import { getAppSnapshot, getCurrentUser } from "@/lib/services/app-service";

export default async function AdminFakesPage() {
  const snapshot = await getAppSnapshot();
  const currentUser = await getCurrentUser(snapshot);

  if (currentUser?.role !== "admin" && currentUser?.role !== "owner") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Acesso restrito</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <AdminFakePredictionsManager
      competitionId={snapshot.competition.id}
      teams={snapshot.teams}
      phases={getSortedPhases(snapshot.phases).filter(
        (phase) =>
          snapshot.matches.some((match) => match.phaseId === phase.id) ||
          phase.slug === "fase-de-grupos",
      )}
    />
  );
}
