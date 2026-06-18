"use client";

import { useActionState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { syncResultsProvider } from "@/app/actions";
import { SubmitButton } from "@/components/forms/submit-button";
import type { ActionResult } from "@/lib/domain/types";
import type { ResultsSyncSummary } from "@/lib/services/results-provider";

const initialState: ActionResult<ResultsSyncSummary> = {
  ok: false,
  message: "",
};

export function SyncResultsButton() {
  const [state, formAction] = useActionState(syncResultsProvider, initialState);
  const summary = state.data;

  useEffect(() => {
    if (!state.message) return;
    toast[state.ok ? "success" : "error"](state.message);
  }, [state]);

  return (
    <form action={formAction} className="space-y-3">
      <SubmitButton pendingLabel="Sincronizando...">
        <RefreshCw className="h-4 w-4" />
        Sincronizar agora
      </SubmitButton>

      {summary ? (
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
      ) : null}
    </form>
  );
}
