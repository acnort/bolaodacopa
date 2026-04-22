"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { saveOfficialResult } from "@/app/actions";
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

export function OfficialResultForm({
  matchId,
  defaults,
}: {
  matchId: string;
  defaults?: { homeScore?: number; awayScore?: number; status?: string };
}) {
  const [state, formAction] = useActionState(saveOfficialResult, initialState);

  useEffect(() => {
    if (!state.message) return;
    toast[state.ok ? "success" : "error"](state.message);
  }, [state]);

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-[1fr_1fr_1.2fr_auto] sm:items-end">
      <input type="hidden" name="matchId" value={matchId} />
      <div className="space-y-2">
        <label className="text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
          Casa
        </label>
        <Input name="homeScore" type="number" min={0} max={20} defaultValue={defaults?.homeScore ?? 0} />
      </div>
      <div className="space-y-2">
        <label className="text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
          Fora
        </label>
        <Input name="awayScore" type="number" min={0} max={20} defaultValue={defaults?.awayScore ?? 0} />
      </div>
      <div className="space-y-2">
        <label className="text-xs uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
          Status
        </label>
        <Select defaultValue={defaults?.status ?? "completed"} name="status">
          <SelectTrigger>
            <SelectValue placeholder="Status da partida" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="scheduled">Agendada</SelectItem>
            <SelectItem value="in_progress">Em andamento</SelectItem>
            <SelectItem value="completed">Encerrada</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <SubmitButton size="sm" pendingLabel="Publicando...">
        Publicar
      </SubmitButton>
      <div className="sm:col-span-4">
        <FormFeedback state={state} />
      </div>
    </form>
  );
}
