import { AdminMembersManager } from "@/components/admin-members-manager";
import { AdminResultsManager } from "@/components/admin-results-manager";
import { AdminPhaseRulesForm } from "@/components/forms/admin-phase-rules-form";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAppSnapshot, getCurrentUser } from "@/lib/services/app-service";

export default async function AdminPage() {
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
    <div className="space-y-6">
      <Tabs defaultValue="rules">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="rules">Regras</TabsTrigger>
          <TabsTrigger value="results">Resultados</TabsTrigger>
          <TabsTrigger value="members">Membros</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" forceMount>
          <AdminPhaseRulesForm phases={snapshot.phases} rules={snapshot.rules} />
        </TabsContent>

        <TabsContent value="results" forceMount>
          <AdminResultsManager snapshot={snapshot} />
        </TabsContent>

        <TabsContent value="members" forceMount>
          <AdminMembersManager snapshot={snapshot} currentUserId={currentUser.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
