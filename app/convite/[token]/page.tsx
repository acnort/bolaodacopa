import type { Metadata } from "next";
import Link from "next/link";

import { InviteAcceptanceForm } from "@/components/forms/invite-acceptance-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/formatters";
import { getAppSnapshot } from "@/lib/services/app-service";

export const metadata: Metadata = {
  title: "Aceitar convite",
};

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const snapshot = await getAppSnapshot();
  const invite = snapshot.invites.find((item) => item.token === token);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-4 py-10 md:px-6">
      <div className="grid w-full gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="bg-[linear-gradient(160deg,#eceae5,#f7f6f3)]">
          <CardContent className="space-y-6 p-8">
            <Badge variant={invite ? "success" : "danger"}>
              {invite ? "convite encontrado" : "convite inválido"}
            </Badge>
            <div className="space-y-3">
              <h1 className="text-4xl font-semibold text-[color:var(--text-strong)]">
                Entre no bolão da Copa.
              </h1>
              <p className="text-sm leading-7 text-[color:var(--text-muted)]">
                Convite privado para um único grupo entre amigos, com ranking geral e área admin
                centralizada.
              </p>
            </div>
            {invite ? (
              <div className="rounded-lg border border-[color:var(--border-subtle)] bg-[color:var(--surface-base)] p-5">
                <p className="text-sm text-[color:var(--text-muted)]">Convite enviado para</p>
                <p className="mt-1 text-lg font-semibold">{invite.email}</p>
                <p className="mt-3 text-sm text-[color:var(--text-muted)]">
                  Expira em {formatDate(invite.expiresAt)} · perfil {invite.role}
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-[color:var(--border-subtle)] bg-[color:var(--surface-base)] p-5 text-sm text-[color:var(--text-muted)]">
                O token informado não existe neste ambiente demo. Use o exemplo
                <span className="font-semibold text-[color:var(--text-strong)]"> convite-pedro-2026</span>.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Completar cadastro</CardTitle>
            <CardDescription>
              Primeiro acesso via magic link, depois login por link ou senha opcional.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {invite ? (
              <InviteAcceptanceForm token={token} />
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-[color:var(--text-muted)]">
                  Peça um novo convite a um admin ou volte para o login.
                </p>
                <Button asChild className="w-full">
                  <Link href="/entrar">Ir para login</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
