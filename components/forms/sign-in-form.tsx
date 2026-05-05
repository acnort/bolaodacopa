"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { toast } from "sonner";

import { signIn } from "@/app/actions";
import { FormFeedback } from "@/components/forms/form-feedback";
import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";
import type { ActionResult } from "@/lib/domain/types";

const initialState: ActionResult<{ redirectTo: string }> = {
  ok: false,
  message: "",
};

export function SignInForm({ defaultEmail = "" }: { defaultEmail?: string }) {
  const router = useRouter();
  const [state, formAction] = useActionState(signIn, initialState);
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
    <form action={formAction} className="space-y-6">
      <div className="space-y-3">
        <label className="text-sm font-medium text-[color:var(--text-strong)]">
          Email
        </label>
        <Input
          name="email"
          type="email"
          placeholder="voce@exemplo.com"
          defaultValue={defaultEmail}
        />
        <FormFeedback field="email" state={state} />
      </div>

      <FormFeedback state={state} />

      <SubmitButton className="w-full" pendingLabel="Entrando...">
        <LogIn className="h-4 w-4" />
        Entrar
      </SubmitButton>
    </form>
  );
}
