"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { savePlacementPrediction } from "@/app/actions";
import { FormFeedback } from "@/components/forms/form-feedback";
import { SubmitButton } from "@/components/forms/submit-button";
import { CustomSelect } from "@/components/ui/custom-select";
import type { ActionResult, Team } from "@/lib/domain/types";

const initialState: ActionResult = { ok: false, message: "" };

export function PlacementPredictionForm({
  userId,
  competitionId,
  teams,
  defaults,
  disabled,
}: {
  userId: string;
  competitionId: string;
  teams: Team[];
  defaults?: {
    championTeamId?: string;
    runnerUpTeamId?: string;
    thirdPlaceTeamId?: string;
  };
  disabled?: boolean;
}) {
  const [state, formAction] = useActionState(savePlacementPrediction, initialState);
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
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="competitionId" value={competitionId} />

      <div className="space-y-2">
        <label className="text-sm font-medium text-[color:var(--text-strong)]">
          Campeão
        </label>
        <CustomSelect
          defaultValue={defaults?.championTeamId}
          name="championTeamId"
          options={teamOptions}
          placeholder="Selecione o campeão"
          searchPlaceholder="Buscar país"
          emptyMessage="Nenhum país encontrado."
          listLabel="Países"
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-[color:var(--text-strong)]">
          Vice-campeão
        </label>
        <CustomSelect
          defaultValue={defaults?.runnerUpTeamId}
          name="runnerUpTeamId"
          options={teamOptions}
          placeholder="Selecione o vice"
          searchPlaceholder="Buscar país"
          emptyMessage="Nenhum país encontrado."
          listLabel="Países"
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-[color:var(--text-strong)]">
          Terceiro lugar
        </label>
        <CustomSelect
          defaultValue={defaults?.thirdPlaceTeamId}
          name="thirdPlaceTeamId"
          options={teamOptions}
          placeholder="Selecione o terceiro lugar"
          searchPlaceholder="Buscar país"
          emptyMessage="Nenhum país encontrado."
          listLabel="Países"
          disabled={disabled}
        />
      </div>

      <FormFeedback field="thirdPlaceTeamId" state={state} />
      <FormFeedback state={state} />
      <SubmitButton className="w-full" disabled={disabled} pendingLabel="Salvando...">
        Salvar pódio
      </SubmitButton>
    </form>
  );
}
