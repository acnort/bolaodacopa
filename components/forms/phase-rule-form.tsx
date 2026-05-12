"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { savePhaseRule } from "@/app/actions";
import { BrazilianDateTimeInput } from "@/components/forms/br-datetime-input";
import { FormFeedback } from "@/components/forms/form-feedback";
import { SubmitButton } from "@/components/forms/submit-button";
import { Input } from "@/components/ui/input";
import type { ActionResult, PredictionRule } from "@/lib/domain/types";

const initialState: ActionResult = { ok: false, message: "" };

export function PhaseRuleForm({
  rule,
  podium
}: {
  rule: PredictionRule;
  podium?: boolean;
}) {
  const [state, formAction] = useActionState(savePhaseRule, initialState);

  useEffect(() => {
    if (!state.message) return;
    toast[state.ok ? "success" : "error"](state.message);
  }, [state]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="phaseId" value={rule.phaseId} />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex items-center gap-3 rounded-lg bg-[color:var(--surface-muted)] p-3 text-sm text-[color:var(--text-strong)]">
          <input
            name="enableMatchPredictions"
            type="checkbox"
            defaultChecked={rule.enableMatchPredictions}
          />
          Habilitar palpites de jogos
        </label>
        <label className="flex items-center gap-3 rounded-lg bg-[color:var(--surface-muted)] p-3 text-sm text-[color:var(--text-strong)]">
          <input
            name="enablePlacementPredictions"
            type="checkbox"
            defaultChecked={rule.enablePlacementPredictions}
          />
          Habilitar palpites de pódio
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-[color:var(--text-strong)]">
            Abertura
          </label>
          <BrazilianDateTimeInput
            name="opensAt"
            defaultValue={rule.opensAt}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-[color:var(--text-strong)]">
            Fechamento
          </label>
          <BrazilianDateTimeInput
            name="closesAt"
            defaultValue={rule.closesAt}
          />
        </div>
      </div>
      {podium ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="text-sm text-[color:var(--text-muted)]">Campeão</label>
            <Input name="champion" type="number" min={0} defaultValue={rule.scoring.champion} />
          </div>
          <div>
            <label className="text-sm text-[color:var(--text-muted)]">Vice</label>
            <Input name="runnerUp" type="number" min={0} defaultValue={rule.scoring.runnerUp} />
          </div>
          <div>
            <label className="text-sm text-[color:var(--text-muted)]">Terceiro</label>
            <Input name="thirdPlace" type="number" min={0} defaultValue={rule.scoring.thirdPlace} />
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-sm text-[color:var(--text-muted)]">Exato</label>
            <Input name="exactScore" type="number" min={0} defaultValue={rule.scoring.exactScore} />
          </div>
          <div>
            <label className="text-sm text-[color:var(--text-muted)]">Vencedor</label>
            <Input name="correctOutcome" type="number" min={0} defaultValue={rule.scoring.correctOutcome} />
          </div>
        </div>
      )}      
      <input type="hidden" name="status" value={rule.status} />
      <FormFeedback state={state} />
      <SubmitButton className="w-full" pendingLabel="Atualizando fase...">
        Salvar regra da fase
      </SubmitButton>
    </form>
  );
}
