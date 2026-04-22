"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { saveMatchPrediction } from "@/app/actions";
import { FormFeedback } from "@/components/forms/form-feedback";
import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";
import type { ActionResult } from "@/lib/domain/types";

const initialState: ActionResult = { ok: false, message: "" };

export function MatchPredictionForm({
  userId,
  matchId,
  defaultHomeScore,
  defaultAwayScore,
  disabled,
}: {
  userId: string;
  matchId: string;
  defaultHomeScore?: number;
  defaultAwayScore?: number;
  disabled?: boolean;
}) {
  const [state, formAction] = useActionState(saveMatchPrediction, initialState);

  useEffect(() => {
    if (!state.message) return;
    toast[state.ok ? "success" : "error"](state.message);
  }, [state]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="matchId" value={matchId} />

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div>
          <Input
            name="homeScore"
            type="number"
            min={0}
            max={20}
            defaultValue={defaultHomeScore ?? 0}
            disabled={disabled}
          />
          <FormFeedback field="homeScore" state={state} />
        </div>
        <span className="text-sm text-[color:var(--text-muted)]">x</span>
        <div>
          <Input
            name="awayScore"
            type="number"
            min={0}
            max={20}
            defaultValue={defaultAwayScore ?? 0}
            disabled={disabled}
          />
          <FormFeedback field="awayScore" state={state} />
        </div>
      </div>

      <FormFeedback state={state} />
      <SubmitButton
        className="w-full"
        disabled={disabled}
        pendingLabel="Enviando palpite..."
      >
        Salvar palpite
      </SubmitButton>
    </form>
  );
}
