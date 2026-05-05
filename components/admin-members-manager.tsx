import {
  ApproveSignupRequestButton,
  RejectSignupRequestButton,
  RemoveSignupRequestButton,
  RemoveMemberButton,
} from "@/components/forms/remove-access-buttons";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AppSnapshot } from "@/lib/domain/types";
import { formatDate } from "@/lib/formatters";

function getStatusVariant(status: "pending" | "approved" | "rejected") {
  if (status === "approved") return "success";
  if (status === "pending") return "warning";
  return "danger";
}

export function AdminMembersManager({
  snapshot,
  currentUserId,
}: {
  snapshot: AppSnapshot;
  currentUserId: string;
}) {
  const signupLink = "/cadastro";

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
        <Card>
          <CardHeader>
            <CardTitle>Link de cadastro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input value={signupLink} readOnly />
            <p className="text-sm text-[color:var(--text-muted)]">
              Envie este link para quem quiser entrar. O acesso só libera depois da aprovação.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Membros</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead className="w-[96px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {snapshot.profiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell className="font-semibold">{profile.fullName}</TableCell>
                    <TableCell>{profile.email}</TableCell>
                    <TableCell>{profile.role}</TableCell>
                    <TableCell className="text-right">
                      <RemoveMemberButton
                        userId={profile.id}
                        disabled={profile.id === currentUserId}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Solicitações</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Pedido</TableHead>
                <TableHead>Análise</TableHead>
                <TableHead className="w-[140px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {snapshot.signupRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-semibold">{request.fullName}</TableCell>
                  <TableCell>{request.email}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(request.status)}>{request.status}</Badge>
                  </TableCell>
                  <TableCell>{formatDate(request.requestedAt)}</TableCell>
                  <TableCell>
                    {request.reviewedAt ? formatDate(request.reviewedAt) : "Pendente"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <ApproveSignupRequestButton
                        requestId={request.id}
                        disabled={request.status !== "pending"}
                      />
                      <RejectSignupRequestButton
                        requestId={request.id}
                        disabled={request.status !== "pending"}
                      />
                      <RemoveSignupRequestButton
                        requestId={request.id}
                        disabled={request.status === "approved"}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
