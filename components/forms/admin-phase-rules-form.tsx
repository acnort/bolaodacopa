"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { savePhaseRulesBatch } from "@/app/actions";
import { BrazilianDateTimeInput } from "@/components/forms/br-datetime-input";
import { FormFeedback } from "@/components/forms/form-feedback";
import { SubmitButton } from "@/components/forms/submit-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ActionResult, Phase, PredictionRule } from "@/lib/domain/types";
import { formatPhaseWindow } from "@/lib/formatters";

const initialState: ActionResult = { ok: false, message: "" };

export function AdminPhaseRulesForm({
  phases,
  rules,
}: {
  phases: Phase[];
  rules: PredictionRule[];
}) {
  const [state, formAction] = useActionState(savePhaseRulesBatch, initialState);

  useEffect(() => {
    if (!state.message) return;
    toast[state.ok ? "success" : "error"](state.message);
  }, [state]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-2">
        {phases.map((phase) => {
          const rule = rules.find((item) => item.phaseId === phase.id);
          if (!rule) return null;

          const isPodium = rule.enablePlacementPredictions;

          return (
            <Card key={phase.id}>
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>{phase.name}</CardTitle>
                    <div className="mt-1 text-sm text-[color:var(--text-muted)]">
                      {formatPhaseWindow(phase.startsAt, phase.endsAt)}
                    </div>
                  </div>
                  <Badge
                    variant={rule.status === "active" ? "success" : "neutral"}
                    size="small"
                  >
                    {rule.status === "active" ? "Ativa" : "Fechada"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <input type="hidden" name="phaseId" value={phase.id} />
                <input
                  type="hidden"
                  name={`enableMatchPredictions:${phase.id}`}
                  value={String(rule.enableMatchPredictions)}
                />
                <input
                  type="hidden"
                  name={`enablePlacementPredictions:${phase.id}`}
                  value={String(rule.enablePlacementPredictions)}
                />
                <input
                  type="hidden"
                  name={`status:${phase.id}`}
                  value={rule.status}
                />

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[color:var(--text-strong)]">
                      Abertura
                    </label>
                    <BrazilianDateTimeInput
                      name={`opensAt:${phase.id}`}
                      defaultValue={rule.opensAt}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[color:var(--text-strong)]">
                      Fechamento
                    </label>
                    <BrazilianDateTimeInput
                      name={`closesAt:${phase.id}`}
                      defaultValue={rule.closesAt}
                    />
                  </div>
                </div>

                {isPodium ? (
                  <div className="grid gap-3 sm:grid-cols-3">
                    <input
                      type="hidden"
                      name={`exactScore:${phase.id}`}
                      value={0}
                    />
                    <input
                      type="hidden"
                      name={`correctOutcome:${phase.id}`}
                      value={0}
                    />
                    <div className="space-y-2">
                      <label className="text-sm text-[color:var(--text-muted)]">
                        Campeão
                      </label>
                      <Input
                        name={`champion:${phase.id}`}
                        type="number"
                        min={0}
                        defaultValue={rule.scoring.champion}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-[color:var(--text-muted)]">
                        Vice
                      </label>
                      <Input
                        name={`runnerUp:${phase.id}`}
                        type="number"
                        min={0}
                        defaultValue={rule.scoring.runnerUp}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-[color:var(--text-muted)]">
                        Terceiro
                      </label>
                      <Input
                        name={`thirdPlace:${phase.id}`}
                        type="number"
                        min={0}
                        defaultValue={rule.scoring.thirdPlace}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      type="hidden"
                      name={`champion:${phase.id}`}
                      value={0}
                    />
                    <input
                      type="hidden"
                      name={`runnerUp:${phase.id}`}
                      value={0}
                    />
                    <input
                      type="hidden"
                      name={`thirdPlace:${phase.id}`}
                      value={0}
                    />
                    <div className="space-y-2">
                      <label className="text-sm text-[color:var(--text-muted)]">
                        Placar exato
                      </label>
                      <Input
                        name={`exactScore:${phase.id}`}
                        type="number"
                        min={0}
                        defaultValue={rule.scoring.exactScore}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-[color:var(--text-muted)]">
                        Acertou vencedor / empate
                      </label>
                      <Input
                        name={`correctOutcome:${phase.id}`}
                        type="number"
                        min={0}
                        defaultValue={rule.scoring.correctOutcome}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="sticky bottom-4 z-20 rounded-xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-base)]/95 px-4 py-3 shadow-[var(--shadow-card)] backdrop-blur">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-[color:var(--text-muted)]">
            Salva janelas e pontuações de todas as fases.
          </div>
          <SubmitButton pendingLabel="Salvando regras...">
            Salvar regras
          </SubmitButton>
        </div>
        <FormFeedback state={state} />
      </div>
    </form>
  );
}
