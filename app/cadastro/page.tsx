import type { Metadata } from "next";
import Link from "next/link";

import { SignupForm } from "@/components/forms/signup-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Cadastro",
};

export default function SignupPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10 md:px-6">
      <div className="grid w-full gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="bg-[linear-gradient(150deg,#2c2c2c,#464646)] text-white">
          <CardContent className="space-y-6 p-8">
            <Badge variant="accent">cadastro com aprovação</Badge>
            <div className="space-y-3">
              <h1 className="text-4xl font-semibold">Peça acesso ao bolão.</h1>
              <p className="text-sm leading-7 text-white/75">
                Faça seu cadastro e aguarde a liberação de um admin para entrar.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Solicitar acesso</CardTitle>
            <CardDescription>
              O acesso só fica disponível depois da aprovação.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <SignupForm />
            <Button asChild variant="ghost" className="w-full">
              <Link href="/entrar">Já fui aprovado</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
