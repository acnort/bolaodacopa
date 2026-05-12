"use client";

import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

import {
  ApproveSignupRequestButton,
  CreateAccessInviteButton,
  MemberRoleSelect,
  RejectSignupRequestButton,
  RemoveSignupRequestButton,
  RemoveMemberButton,
} from "@/components/forms/remove-access-buttons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import type { AppSnapshot, UserRole } from "@/lib/domain/types";
import { formatDate } from "@/lib/formatters";

function getStatusVariant(status: "pending" | "approved" | "rejected") {
  if (status === "approved") return "success";
  if (status === "pending") return "warning";
  return "danger";
}

export function AdminMembersManager({
  snapshot,
  currentUserId,
  currentUserRole,
  appUrl,
}: {
  snapshot: AppSnapshot;
  currentUserId: string;
  currentUserRole: UserRole;
  appUrl?: string;
}) {
  const [copied, setCopied] = useState(false);
  const accessToken = snapshot.accessInvites[0]?.token;
  const origin =
    appUrl?.replace(/\/$/, "") ??
    (typeof window === "undefined" ? "" : window.location.origin);
  const accessLink = useMemo(() => {
    if (!accessToken) return "";
    return `${origin}/convite/${accessToken}`;
  }, [accessToken, origin]);
  const canManageRoles = currentUserRole === "owner";

  async function copyAccessLink() {
    if (!accessLink) return;

    await navigator.clipboard.writeText(accessLink);
    setCopied(true);
    toast.success("Link copiado.");
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-12 xl:grid-cols-[0.78fr_1.22fr]">
        <Card>
          <CardHeader>
            <CardTitle>Link de acesso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
              <Input
                value={accessLink || "Nenhum link ativo"}
                readOnly
                className="font-mono text-xs"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={copyAccessLink}
                disabled={!accessLink}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copiado" : "Copiar"}
              </Button>
            </div>
            <p className="text-sm text-[color:var(--text-muted)]">
              Envie este link para convidados criarem email e senha. O mesmo link pode ser usado por várias pessoas.
            </p>
            <CreateAccessInviteButton />
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
                  <TableHead className="w-[220px]">Alterar perfil</TableHead>
                  <TableHead className="w-[96px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {snapshot.profiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell className="font-semibold">{profile.fullName}</TableCell>
                    <TableCell>{profile.email}</TableCell>
                    <TableCell>{profile.role}</TableCell>
                    <TableCell>
                      {profile.role === "owner" ? (
                        <span className="text-sm text-[color:var(--text-muted)]">
                          Owner via script
                        </span>
                      ) : (
                        <MemberRoleSelect
                          userId={profile.id}
                          role={profile.role}
                          disabled={!canManageRoles}
                        />
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <RemoveMemberButton
                        userId={profile.id}
                        disabled={profile.id === currentUserId || profile.role !== "member"}
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
          <CardTitle>Acessos criados pelo link</CardTitle>
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
