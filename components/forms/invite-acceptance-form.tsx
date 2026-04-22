"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { acceptInvite } from "@/app/actions";
import { FormFeedback } from "@/components/forms/form-feedback";
import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";
import type { ActionResult } from "@/lib/domain/types";

const initialState: ActionResult = { ok: false, message: "" };

export function InviteAcceptanceForm({ token }: { token: string }) {
  const [state, formAction] = useActionState(acceptInvite, initialState);

  useEffect(() => {
    if (!state.message) return;
    toast[state.ok ? "success" : "error"](state.message);
  }, [state]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <div className="space-y-2">
        <label className="text-sm font-medium text-[color:var(--text-strong)]">
          Nome completo
        </label>
        <Input name="fullName" placeholder="Seu nome" />
        <FormFeedback field="fullName" state={state} />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-[color:var(--text-strong)]">
          Senha inicial
        </label>
        <Input name="password" type="password" placeholder="Opcional no primeiro acesso" />
      </div>
      <FormFeedback state={state} />
      <SubmitButton className="w-full" pendingLabel="Concluindo cadastro...">
        Aceitar convite
      </SubmitButton>
    </form>
  );
}
