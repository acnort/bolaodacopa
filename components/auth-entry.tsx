import Image from "next/image";

import { SignInForm } from "@/components/forms/sign-in-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function AuthEntry({ defaultEmail = "" }: { defaultEmail?: string }) {
  return (
    <main className="surface-grid flex min-h-screen items-center justify-center px-4 py-10">
      <section className="w-full max-w-md">
        <div className="mb-7 flex flex-col items-center text-center">
          <div className="relative w-[800px] h-[200px]">
            <Image
              src="/logo_h.png"
              alt="Bolão da Copa"
              fill
              priority
              sizes="288px"
              className="object-contain"
            />
          </div>
          <p className="mt-5 text-xs font-semibold tracking-[0.28em] text-[color:var(--text-muted)] uppercase">
            Bolão da Copa
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[color:var(--text-strong)]">
            Entrar no bolão
          </h1>
        </div>

        <Card className="border-[color:var(--border-subtle)] bg-[color:var(--surface-base)]/95 shadow-[var(--shadow-card)] backdrop-blur">
          <CardHeader className="text-center">
            <CardTitle>Área privada</CardTitle>
            <CardDescription>
              Use o email aprovado pelo admin para acessar seus palpites.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <SignInForm defaultEmail={defaultEmail} />
            <div className="rounded-lg bg-[color:var(--surface-muted)] p-4 text-center text-sm text-[color:var(--text-muted)]">
              Primeiro acesso só pelo link enviado pelo admin.
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
