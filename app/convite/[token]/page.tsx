import type { Metadata } from "next";
import Link from "next/link";

import { AccessSetupForm } from "@/components/forms/access-setup-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAppSnapshot } from "@/lib/services/app-service";

export const metadata: Metadata = {
  title: "Ativar acesso",
};

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const snapshot = await getAppSnapshot();
  const invite = snapshot.accessInvites.find((item) => item.token === token);

  if (!invite) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-xl items-center px-4 py-10 md:px-6">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Link inválido</CardTitle>
            <CardDescription>
              Este link de acesso não existe ou já foi removido.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/">Voltar para entrada</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const isActive = !invite.revokedAt;

  return (
    <main className="surface-grid flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-xl border-[color:var(--border-subtle)] bg-[color:var(--surface-base)]/95 shadow-[var(--shadow-card)] backdrop-blur">
        <CardHeader>
          <Badge variant={isActive ? "warning" : "danger"}>
            {isActive ? "convite ativo" : "convite revogado"}
          </Badge>
          <CardTitle className="pt-3">
            {isActive ? "Solicite seu acesso" : "Este link não está disponível"}
          </CardTitle>
          <CardDescription>
            Defina email e senha. O admin precisa aprovar seu cadastro antes do
            acesso ao bolão.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isActive ? (
            <AccessSetupForm token={token} />
          ) : (
            <>
              <p className="text-sm text-[color:var(--text-muted)]">
                Este convite foi revogado pelo admin.
              </p>
              <Button asChild className="w-full">
                <Link href="/">Ir para entrada</Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
