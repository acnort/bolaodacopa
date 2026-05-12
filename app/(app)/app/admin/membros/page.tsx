import { AdminMembersManager } from "@/components/admin-members-manager";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { getAppSnapshot, getCurrentUser } from "@/lib/services/app-service";

export default async function AdminMembersPage() {
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

  return (
    <AdminMembersManager
      snapshot={snapshot}
      currentUserId={currentUser.id}
      appUrl={process.env.APP_URL}
    />
  );
}
