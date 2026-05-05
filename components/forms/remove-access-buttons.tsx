"use client";

import { useActionState, useEffect } from "react";
import { Check, Trash2, UserMinus, X } from "lucide-react";
import { toast } from "sonner";

import {
  removeMember,
  removeSignupRequest,
  reviewSignupRequest,
} from "@/app/actions";
import { SubmitButton } from "@/components/forms/submit-button";
import type { ActionResult } from "@/lib/domain/types";

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
