"use client";

import { useActionState, useEffect } from "react";
import { CalendarDays, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import {
  syncNextPhaseMatchesProvider,
  syncResultsProvider,
} from "@/app/actions";
import { SubmitButton } from "@/components/forms/submit-button";
import type { ActionResult } from "@/lib/domain/types";
import type { ResultsSyncSummary } from "@/lib/services/results-provider";

const initialState: ActionResult<ResultsSyncSummary> = {
  ok: false,
  message: "",
};

function SyncSummary({ summary }: { summary?: ResultsSyncSummary }) {
  if (!summary) return null;
  return (
    <div className="rounded-lg border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)]/50 p-3 text-xs leading-5 text-[color:var(--text-muted)]">
      <div>Provider: {summary.provider}</div>
      <div>
        Jogos lidos: {summary.matches} · persistidos:{" "}
        {summary.persistedMatches ?? 0}
      </div>
      <div>
        Resultados lidos: {summary.results} · persistidos:{" "}
        {summary.persistedResults ?? 0}
      </div>
      {summary.unmatchedMatches ? (
        <div>Sem correspondência: {summary.unmatchedMatches}</div>
      ) : null}
      {summary.skipped ? <div>Ignorado: {summary.skipReason}</div> : null}
    </div>
  );
}

type SyncAction = (
  prevState: ActionResult<ResultsSyncSummary> | undefined,
) => Promise<ActionResult<ResultsSyncSummary>>;

function SyncActionForm({
  action,
  children,
  pendingLabel,
}: {
  action: SyncAction;
  children: React.ReactNode;
  pendingLabel: string;
}) {
  const [state, formAction] = useActionState(action, initialState);

  useEffect(() => {
    if (!state.message) return;
    toast[state.ok ? "success" : "error"](state.message);
  }, [state]);

  return (
    <form action={formAction} className="space-y-3">
      <SubmitButton pendingLabel={pendingLabel}>{children}</SubmitButton>
      <SyncSummary summary={state.data} />
    </form>
  );
}

export function SyncResultsButton() {
  return (
    <div className="space-y-4">
      <SyncActionForm
        action={syncResultsProvider}
        pendingLabel="Sincronizando..."
      >
        <RefreshCw className="h-4 w-4" />
        Sincronizar agora
      </SyncActionForm>

      <SyncActionForm
        action={syncNextPhaseMatchesProvider}
        pendingLabel="Sincronizando jogos..."
      >
        <CalendarDays className="h-4 w-4" />
        Sincronizar próximas fases
      </SyncActionForm>
    </div>
  );
}
