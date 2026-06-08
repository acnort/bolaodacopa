import { AdminPredictionsCoverage } from "@/components/admin-predictions-coverage";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { buildAdminPredictionCoverage } from "@/lib/domain/prediction-coverage";
import { getAppSnapshot, getCurrentUser } from "@/lib/services/app-service";

export default async function AdminPredictionsPage() {
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
    <AdminPredictionsCoverage data={buildAdminPredictionCoverage(snapshot)} />
  );
}
