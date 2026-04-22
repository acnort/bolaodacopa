import type { Metadata } from "next";
import Link from "next/link";

import { SignInForm } from "@/components/forms/sign-in-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Entrar",
};

export default function SignInPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10 md:px-6">
      <div className="grid w-full gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="bg-[linear-gradient(150deg,#2c2c2c,#464646)] text-white">
          <CardContent className="space-y-6 p-8">
            <Badge variant="accent">auth por convite</Badge>
            <div className="space-y-3">
              <h1 className="text-4xl font-semibold">Entre no bolão com segurança.</h1>
              <p className="text-sm leading-7 text-white/75">
                Primeiro acesso por magic link, login posterior por novo magic link ou senha
                opcional configurada pelo próprio participante.
              </p>
            </div>
            <div className="rounded-lg bg-white/10 p-5">
              <p className="text-sm text-white/75">Fluxo recomendado</p>
              <p className="mt-2 text-lg font-semibold">Convite por email → magic link → perfil</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Entrar na área privada</CardTitle>
            <CardDescription>
              A integração real com Supabase Auth já está preparada. Nesta versão inicial, os
              botões simulam o fluxo para validar a UX.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <SignInForm />
            <div className="rounded-lg bg-[color:var(--surface-muted)] p-4 text-sm text-[color:var(--text-muted)]">
              Não recebeu convite? Fale com um admin do bolão para liberar seu acesso.
            </div>
            <Button asChild variant="ghost" className="w-full">
              <Link href="/">Voltar para a landing</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
