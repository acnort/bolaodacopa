import { AdminSandboxPanel } from "@/components/admin-sandbox-panel";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminSandboxSnapshot } from "@/lib/services/app-service";

export default async function AdminSandboxPage() {
  const snapshot = await getAdminSandboxSnapshot();

  if (!snapshot) {
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
