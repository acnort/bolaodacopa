"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createSignupRequest } from "@/app/actions";
import { FormFeedback } from "@/components/forms/form-feedback";
import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";
import type { ActionResult } from "@/lib/domain/types";

const initialState: ActionResult<{ token: string }> = { ok: false, message: "" };

export function SignupForm() {
  const router = useRouter();
  const [state, formAction] = useActionState(createSignupRequest, initialState);
  const token =
    state.data && typeof state.data === "object" && "token" in state.data
      ? String(state.data.token)
      : undefined;

  useEffect(() => {
    if (!state.message) return;
    toast[state.ok ? "success" : "error"](state.message);

    if (state.ok && token) {
      router.push(`/cadastro/status/${token}`);
    }
  }, [router, state, token]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-[color:var(--text-strong)]">
          Nome completo
        </label>
        <Input name="fullName" placeholder="Seu nome" />
        <FormFeedback field="fullName" state={state} />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-[color:var(--text-strong)]">
          Email
        </label>
        <Input name="email" type="email" placeholder="voce@exemplo.com" />
        <FormFeedback field="email" state={state} />
      </div>

      <FormFeedback state={state} />

      <SubmitButton className="w-full" pendingLabel="Enviando cadastro...">
        Solicitar acesso
      </SubmitButton>
    </form>
  );
}
