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
import type { AdminMembersData } from "@/lib/services/app-service";
import { formatDate } from "@/lib/formatters";

export function AdminMembersManager({
  data,
  appUrl,
}: {
  data: AdminMembersData;
  appUrl?: string;
}) {
  const [copied, setCopied] = useState(false);
  const origin =
    appUrl?.replace(/\/$/, "") ??
    (typeof window === "undefined" ? "" : window.location.origin);
  const accessLink = useMemo(() => {
    if (!data.activeInviteToken) return "";
    return `${origin}/convite/${data.activeInviteToken}`;
  }, [data.activeInviteToken, origin]);
  const canManageRoles = data.currentUserRole === "owner";

  async function copyAccessLink() {
    if (!accessLink) return;

    await navigator.clipboard.writeText(accessLink);
    setCopied(true);
    toast.success("Link copiado.");
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr] xl:gap-12">
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
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? "Copiado" : "Copiar"}
              </Button>
            </div>
            <p className="text-sm text-[color:var(--text-muted)]">
              Envie este link para convidados solicitarem acesso. O mesmo link
              pode ser usado por várias pessoas.
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
                {data.members.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell className="font-semibold">
                      {profile.fullName}
                    </TableCell>
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
                        disabled={
                          profile.id === data.currentUserId ||
                          profile.role !== "member"
                        }
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
          <CardTitle>Cadastros pendentes</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Pedido</TableHead>
                <TableHead className="w-[140px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.pendingRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-semibold">
                    {request.fullName}
                  </TableCell>
                  <TableCell>{request.email}</TableCell>
                  <TableCell>{formatDate(request.requestedAt)}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <ApproveSignupRequestButton requestId={request.id} />
                      <RejectSignupRequestButton requestId={request.id} />
                      <RemoveSignupRequestButton requestId={request.id} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!data.pendingRequests.length ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-8 text-center text-sm text-[color:var(--text-muted)]"
                  >
                    Nenhum cadastro pendente.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
