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
  defaults?: {
    homeScore?: number;
    awayScore?: number;
    totalHomeScore?: number;
    totalAwayScore?: number;
    extraTimeHomeScore?: number;
    extraTimeAwayScore?: number;
    penaltyHomeScore?: number;
    penaltyAwayScore?: number;
    status?: string;
  };
}) {
  const [state, formAction] = useActionState(saveOfficialResult, initialState);

  useEffect(() => {
    if (!state.message) return;
    toast[state.ok ? "success" : "error"](state.message);
  }, [state]);

  return (
    <form
      action={formAction}
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[repeat(8,minmax(0,1fr))_1.2fr_auto] lg:items-end"
    >
      <input type="hidden" name="matchId" value={matchId} />
      <div className="space-y-2">
        <label className="text-xs tracking-[0.18em] text-[color:var(--text-muted)] uppercase">
          Casa 90 min
        </label>
        <Input
          name="homeScore"
          type="number"
          min={0}
          max={20}
          defaultValue={defaults?.homeScore ?? 0}
        />
      </div>
      <div className="space-y-2">
        <label className="text-xs tracking-[0.18em] text-[color:var(--text-muted)] uppercase">
          Fora 90 min
        </label>
        <Input
          name="awayScore"
          type="number"
          min={0}
          max={20}
          defaultValue={defaults?.awayScore ?? 0}
        />
      </div>
      <div className="space-y-2">
        <label className="text-xs tracking-[0.18em] text-[color:var(--text-muted)] uppercase">
          Casa prorr.
        </label>
        <Input
          name="extraTimeHomeScore"
          type="number"
          min={0}
          max={20}
          defaultValue={defaults?.extraTimeHomeScore ?? ""}
          placeholder="Opcional"
        />
      </div>
      <div className="space-y-2">
        <label className="text-xs tracking-[0.18em] text-[color:var(--text-muted)] uppercase">
          Fora prorr.
        </label>
        <Input
          name="extraTimeAwayScore"
          type="number"
          min={0}
          max={20}
          defaultValue={defaults?.extraTimeAwayScore ?? ""}
          placeholder="Opcional"
        />
      </div>
      <div className="space-y-2">
        <label className="text-xs tracking-[0.18em] text-[color:var(--text-muted)] uppercase">
          Casa pên.
        </label>
        <Input
          name="penaltyHomeScore"
          type="number"
          min={0}
          max={20}
          defaultValue={defaults?.penaltyHomeScore ?? ""}
          placeholder="Opcional"
        />
      </div>
      <div className="space-y-2">
        <label className="text-xs tracking-[0.18em] text-[color:var(--text-muted)] uppercase">
          Fora pên.
        </label>
        <Input
          name="penaltyAwayScore"
          type="number"
          min={0}
          max={20}
          defaultValue={defaults?.penaltyAwayScore ?? ""}
          placeholder="Opcional"
        />
      </div>
      <div className="space-y-2">
        <label className="text-xs tracking-[0.18em] text-[color:var(--text-muted)] uppercase">
          Casa total
        </label>
        <Input
          name="totalHomeScore"
          type="number"
          min={0}
          max={20}
          defaultValue={defaults?.totalHomeScore ?? ""}
          placeholder="Opcional"
        />
      </div>
      <div className="space-y-2">
        <label className="text-xs tracking-[0.18em] text-[color:var(--text-muted)] uppercase">
          Fora total
        </label>
        <Input
          name="totalAwayScore"
          type="number"
          min={0}
          max={20}
          defaultValue={defaults?.totalAwayScore ?? ""}
          placeholder="Opcional"
        />
      </div>
      <div className="space-y-2">
        <label className="text-xs tracking-[0.18em] text-[color:var(--text-muted)] uppercase">
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
      <div className="sm:col-span-2 lg:col-span-10">
        <FormFeedback state={state} />
      </div>
    </form>
  );
}
