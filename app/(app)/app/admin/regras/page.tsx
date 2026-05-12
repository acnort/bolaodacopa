import { AdminPhaseRulesForm } from "@/components/forms/admin-phase-rules-form";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { getAppSnapshot, getCurrentUser } from "@/lib/services/app-service";

export default async function AdminRulesPage() {
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

  return <AdminPhaseRulesForm phases={snapshot.phases} rules={snapshot.rules} />;
}
