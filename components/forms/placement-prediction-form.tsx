"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { savePlacementPrediction } from "@/app/actions";
import { FormFeedback } from "@/components/forms/form-feedback";
import { SubmitButton } from "@/components/forms/submit-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
        <Select defaultValue={defaults?.championTeamId} name="championTeamId" disabled={disabled}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o campeão" />
          </SelectTrigger>
          <SelectContent>
            {teams.map((team) => (
              <SelectItem key={team.id} value={team.id}>
                {team.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-[color:var(--text-strong)]">
          Vice-campeão
        </label>
        <Select defaultValue={defaults?.runnerUpTeamId} name="runnerUpTeamId" disabled={disabled}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o vice" />
          </SelectTrigger>
          <SelectContent>
            {teams.map((team) => (
              <SelectItem key={team.id} value={team.id}>
                {team.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-[color:var(--text-strong)]">
          Terceiro lugar
        </label>
        <Select defaultValue={defaults?.thirdPlaceTeamId} name="thirdPlaceTeamId" disabled={disabled}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o terceiro lugar" />
          </SelectTrigger>
          <SelectContent>
            {teams.map((team) => (
              <SelectItem key={team.id} value={team.id}>
                {team.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <FormFeedback field="thirdPlaceTeamId" state={state} />
      <FormFeedback state={state} />
      <SubmitButton className="w-full" disabled={disabled} pendingLabel="Salvando...">
        Salvar pódio
      </SubmitButton>
    </form>
  );
}
