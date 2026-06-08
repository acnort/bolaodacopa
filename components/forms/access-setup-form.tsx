"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";

import { setupAccess } from "@/app/actions";
import { FormFeedback } from "@/components/forms/form-feedback";
import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";
import type { ActionResult } from "@/lib/domain/types";

const initialState: ActionResult<{ redirectTo: string }> = {
  ok: false,
  message: "",
};

export function AccessSetupForm({ token }: { token: string }) {
  const router = useRouter();
  const [state, formAction] = useActionState(setupAccess, initialState);
  const redirectTo =
    state.data && typeof state.data === "object" && "redirectTo" in state.data
      ? String(state.data.redirectTo)
      : undefined;

  useEffect(() => {
    if (!state.message) return;
    toast[state.ok ? "success" : "error"](state.message);

    if (state.ok && redirectTo) {
      router.push(redirectTo);
    }
  }, [redirectTo, router, state]);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="token" value={token} />

      <div className="space-y-2">
        <label className="text-sm font-medium text-[color:var(--text-strong)]">
          Nome completo
        </label>
        <Input name="fullName" placeholder="Seu nome" autoComplete="name" />
        <FormFeedback field="fullName" state={state} />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-[color:var(--text-strong)]">
          Email
        </label>
        <Input
          name="email"
          type="email"
          placeholder="voce@exemplo.com"
          autoComplete="email"
        />
        <FormFeedback field="email" state={state} />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-[color:var(--text-strong)]">
          Senha
        </label>
        <Input
          name="password"
          type="password"
          placeholder="Mínimo 8 caracteres"
          autoComplete="new-password"
        />
        <FormFeedback field="password" state={state} />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-[color:var(--text-strong)]">
          Confirmar senha
        </label>
        <Input
          name="confirmPassword"
          type="password"
          placeholder="Repita a senha"
          autoComplete="new-password"
        />
        <FormFeedback field="confirmPassword" state={state} />
      </div>

      <FormFeedback state={state} />

      <SubmitButton className="w-full" pendingLabel="Enviando cadastro...">
        <KeyRound className="h-4 w-4" />
        Solicitar acesso
      </SubmitButton>
    </form>
  );
}
