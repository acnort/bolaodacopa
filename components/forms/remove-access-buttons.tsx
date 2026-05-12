"use client";

import { useActionState, useEffect } from "react";
import { Check, LinkIcon, Trash2, UserMinus, X } from "lucide-react";
import { toast } from "sonner";

import {
  createAccessInvite,
  removeMember,
  removeSignupRequest,
  reviewSignupRequest,
  updateMemberRole,
} from "@/app/actions";
import { SubmitButton } from "@/components/forms/submit-button";
import type { ActionResult, UserRole } from "@/lib/domain/types";

const initialState: ActionResult = { ok: false, message: "" };

function useToastState(state: ActionResult) {
  useEffect(() => {
    if (!state.message) return;
    toast[state.ok ? "success" : "error"](state.message);
  }, [state]);
}

export function ApproveSignupRequestButton({
  requestId,
  disabled,
}: {
  requestId: string;
  disabled?: boolean;
}) {
  const [state, formAction] = useActionState(reviewSignupRequest, initialState);
  useToastState(state);

  return (
    <form action={formAction}>
      <input type="hidden" name="requestId" value={requestId} />
      <input type="hidden" name="action" value="approve" />
      <SubmitButton
        variant="ghost"
        size="icon"
        pendingLabel=""
        disabled={disabled}
        aria-label="Aprovar cadastro"
      >
        <Check className="h-4 w-4" />
      </SubmitButton>
    </form>
  );
}

export function RejectSignupRequestButton({
  requestId,
  disabled,
}: {
  requestId: string;
  disabled?: boolean;
}) {
  const [state, formAction] = useActionState(reviewSignupRequest, initialState);
  useToastState(state);

  return (
    <form action={formAction}>
      <input type="hidden" name="requestId" value={requestId} />
      <input type="hidden" name="action" value="reject" />
      <SubmitButton
        variant="ghost"
        size="icon"
        pendingLabel=""
        disabled={disabled}
        aria-label="Recusar cadastro"
      >
        <X className="h-4 w-4" />
      </SubmitButton>
    </form>
  );
}

export function RemoveSignupRequestButton({
  requestId,
  disabled,
}: {
  requestId: string;
  disabled?: boolean;
}) {
  const [state, formAction] = useActionState(removeSignupRequest, initialState);
  useToastState(state);

  return (
    <form action={formAction}>
      <input type="hidden" name="requestId" value={requestId} />
      <SubmitButton
        variant="ghost"
        size="icon"
        pendingLabel=""
        disabled={disabled}
        aria-label="Remover solicitação"
      >
        <Trash2 className="h-4 w-4" />
      </SubmitButton>
    </form>
  );
}

export function RemoveMemberButton({
  userId,
  disabled,
}: {
  userId: string;
  disabled?: boolean;
}) {
  const [state, formAction] = useActionState(removeMember, initialState);
  useToastState(state);

  return (
    <form action={formAction}>
      <input type="hidden" name="userId" value={userId} />
      <SubmitButton
        variant="ghost"
        size="icon"
        pendingLabel=""
        disabled={disabled}
        aria-label="Remover membro"
      >
        <UserMinus className="h-4 w-4" />
      </SubmitButton>
    </form>
  );
}

export function MemberRoleSelect({
  userId,
  role,
  disabled,
}: {
  userId: string;
  role: Extract<UserRole, "admin" | "member">;
  disabled?: boolean;
}) {
  const [state, formAction] = useActionState(updateMemberRole, initialState);
  useToastState(state);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="userId" value={userId} />
      <select
        name="role"
        defaultValue={role}
        disabled={disabled}
        className="h-9 rounded-lg border border-[color:var(--border-subtle)] bg-[color:var(--surface-base)] px-3 text-sm text-[color:var(--text-strong)] outline-none transition focus:border-[color:var(--accent-soft)] focus:ring-2 focus:ring-[color:var(--accent-soft)]/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <option value="member">member</option>
        <option value="admin">admin</option>
      </select>
      <SubmitButton
        variant="secondary"
        size="sm"
        pendingLabel="Salvando..."
        disabled={disabled}
      >
        Salvar
      </SubmitButton>
    </form>
  );
}

export function CreateAccessInviteButton() {
  const [state, formAction] = useActionState(createAccessInvite, initialState);
  useToastState(state);

  return (
    <form action={formAction}>
      <SubmitButton pendingLabel="Gerando...">
        <LinkIcon className="h-4 w-4" />
        Gerar novo link
      </SubmitButton>
    </form>
  );
}
