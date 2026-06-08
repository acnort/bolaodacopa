"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { savePlacementResult } from "@/app/actions";
import { FormFeedback } from "@/components/forms/form-feedback";
import { SubmitButton } from "@/components/forms/submit-button";
import { CustomSelect } from "@/components/ui/custom-select";
import type { ActionResult, PlacementResult, Team } from "@/lib/domain/types";

const initialState: ActionResult = { ok: false, message: "" };

export function PlacementResultForm({
  competitionId,
  teams,
  defaults,
}: {
  competitionId: string;
  teams: Team[];
  defaults: PlacementResult;
}) {
  const [state, formAction] = useActionState(savePlacementResult, initialState);
  const teamOptions = teams.map((team) => ({
    value: team.id,
    label: team.name,
    keywords: [team.shortName, team.code],
  }));

  useEffect(() => {
    if (!state.message) return;
    toast[state.ok ? "success" : "error"](state.message);
  }, [state]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="competitionId" value={competitionId} />

      {[
        { name: "championTeamId", label: "Campeão", defaultValue: defaults.championTeamId },
        { name: "runnerUpTeamId", label: "Vice", defaultValue: defaults.runnerUpTeamId },
        { name: "thirdPlaceTeamId", label: "Terceiro", defaultValue: defaults.thirdPlaceTeamId },
      ].map(({ name, label, defaultValue }) => (
        <div key={name} className="space-y-2">
          <label className="text-sm font-medium text-[color:var(--text-strong)]">
            {label}
          </label>
          <CustomSelect
            defaultValue={defaultValue}
            name={name}
            options={teamOptions}
            placeholder={`Selecione ${label.toLowerCase()}`}
            searchPlaceholder="Buscar país"
            emptyMessage="Nenhum país encontrado."
            listLabel="Países"
          />
        </div>
      ))}

      <FormFeedback state={state} />
      <SubmitButton className="w-full" pendingLabel="Publicando pódio...">
        Salvar resultado final
      </SubmitButton>
    </form>
  );
}
