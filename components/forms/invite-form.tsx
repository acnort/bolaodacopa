"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { createInvite } from "@/app/actions";
import { FormFeedback } from "@/components/forms/form-feedback";
import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ActionResult } from "@/lib/domain/types";

const initialState: ActionResult = { ok: false, message: "" };

export function InviteForm() {
  const [state, formAction] = useActionState(createInvite, initialState);

  useEffect(() => {
    if (!state.message) return;
    toast[state.ok ? "success" : "error"](state.message);
  }, [state]);

  return (
    <form action={formAction} className="grid gap-4">
      <div className="grid gap-2">
        <label className="text-sm font-medium text-[color:var(--text-strong)]">
          Email do convidado
        </label>
        <Input name="email" type="email" placeholder="nome@exemplo.com" />
        <FormFeedback field="email" state={state} />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-[color:var(--text-strong)]">
            Perfil
          </label>
          <Select defaultValue="member" name="role">
            <SelectTrigger>
              <SelectValue placeholder="Escolha um perfil" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="member">Participante</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-[color:var(--text-strong)]">
            Expira em
          </label>
          <Input
            name="expiresAt"
            type="datetime-local"
            defaultValue="2026-06-01T00:00"
          />
        </div>
      </div>
      <FormFeedback state={state} />
      <SubmitButton className="w-full" pendingLabel="Gerando convite...">
        Criar convite
      </SubmitButton>
    </form>
  );
}
