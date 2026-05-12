import { AdminMembersManager } from "@/components/admin-members-manager";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { getAppSnapshot, getCurrentUser } from "@/lib/services/app-service";

export default async function AdminMembersPage() {
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
    <AdminMembersManager
      snapshot={snapshot}
      currentUserId={currentUser.id}
      currentUserRole={currentUser.role}
      appUrl={process.env.APP_URL}
    />
  );
}
