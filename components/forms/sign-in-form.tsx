"use client";

import { useState } from "react";
import { Mail, KeyRound } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <label className="text-sm font-medium text-[color:var(--text-strong)]">
          Email
        </label>
        <Input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          placeholder="voce@exemplo.com"
        />
      </div>
      <div className="space-y-3">
        <label className="text-sm font-medium text-[color:var(--text-strong)]">
          Senha
        </label>
        <Input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          placeholder="Opcional se preferir magic link"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Button
          type="button"
          onClick={() =>
            toast.success(`Magic link simulado enviado para ${email || "seu email"}.`)
          }
        >
          <Mail className="h-4 w-4" />
          Entrar por magic link
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() =>
            toast.success(
              `Login por senha preparado para a camada de auth em Postgres: ${email || "sem email"}.`,
            )
          }
        >
          <KeyRound className="h-4 w-4" />
          Entrar com senha
        </Button>
      </div>
    </div>
  );
}
