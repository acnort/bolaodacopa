import { AdminMembersManager } from "@/components/admin-members-manager";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminMembersData } from "@/lib/services/app-service";

export default async function AdminMembersPage() {
  const data = await getAdminMembersData();

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Acesso restrito</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return <AdminMembersManager data={data} appUrl={process.env.APP_URL} />;
}
