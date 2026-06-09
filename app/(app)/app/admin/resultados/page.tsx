import { AdminResultsManager } from "@/components/admin-results-manager";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getCurrentUser,
  getPublicResultsSnapshot,
} from "@/lib/services/app-service";

export default async function AdminResultsPage() {
  const snapshot = await getPublicResultsSnapshot();
  const currentUser = await getCurrentUser();

  if (currentUser?.role !== "admin" && currentUser?.role !== "owner") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Acesso restrito</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return <AdminResultsManager snapshot={snapshot} />;
}
