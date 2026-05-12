import { AdminSandboxPanel } from "@/components/admin-sandbox-panel";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { getAppSnapshot, getCurrentUser } from "@/lib/services/app-service";

export default async function AdminSandboxPage() {
  const snapshot = await getAppSnapshot();
  const currentUser = await getCurrentUser(snapshot);

  if (currentUser?.role !== "admin") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Acesso restrito</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return <AdminSandboxPanel snapshot={snapshot} />;
}
