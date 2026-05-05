import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDate } from "@/lib/formatters";
import { getAppSnapshot } from "@/lib/services/app-service";

export const metadata: Metadata = {
  title: "Status do cadastro",
};

export default async function SignupStatusPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const snapshot = await getAppSnapshot();
  const request = snapshot.signupRequests.find((item) => item.token === token);

  if (!request) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-10 md:px-6">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Cadastro não encontrado</CardTitle>
            <CardDescription>
              Este link não corresponde a nenhuma solicitação.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/cadastro">Voltar para cadastro</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const badgeVariant =
    request.status === "approved"
      ? "success"
      : request.status === "pending"
        ? "warning"
        : "danger";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-10 md:px-6">
      <Card className="w-full">
        <CardHeader>
          <Badge variant={badgeVariant}>{request.status}</Badge>
          <CardTitle className="pt-3">
            {request.status === "pending" && "Cadastro em análise"}
            {request.status === "approved" && "Cadastro aprovado"}
            {request.status === "rejected" && "Cadastro recusado"}
          </CardTitle>
          <CardDescription>
            {request.fullName} · {request.email}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] p-4 text-sm text-[color:var(--text-muted)]">
            Pedido enviado em {formatDate(request.requestedAt)}
            {request.reviewedAt ? ` · analisado em ${formatDate(request.reviewedAt)}` : ""}
          </div>

          {request.status === "pending" && (
            <p className="text-sm text-[color:var(--text-muted)]">
              Seu cadastro já foi recebido. Enquanto isso, esta é a única tela disponível.
            </p>
          )}

          {request.status === "approved" && (
            <Button asChild className="w-full">
              <Link href={`/entrar?email=${encodeURIComponent(request.email)}`}>
                Entrar no bolão
              </Link>
            </Button>
          )}

          {request.status === "rejected" && (
            <Button asChild variant="outline" className="w-full">
              <Link href="/cadastro">Fazer novo pedido</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
