"use client";

import { useActionState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { clearOfficialResults } from "@/app/actions";
import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { ActionResult } from "@/lib/domain/types";

const initialState: ActionResult = { ok: false, message: "" };

export function ClearResultsDialog({ disabled }: { disabled?: boolean }) {
  const [state, formAction] = useActionState(
    clearOfficialResults,
    initialState,
  );

  useEffect(() => {
    if (!state.message) return;
    toast[state.ok ? "success" : "error"](state.message);
  }, [state]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="danger" disabled={disabled}>
          <Trash2 className="h-4 w-4" />
          Limpar resultados
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Limpar resultados oficiais?</DialogTitle>
          <DialogDescription>
            Esta ação remove todos os placares publicados dos jogos e recalcula
            o ranking sem esses pontos.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="mt-6 flex justify-end gap-3">
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Cancelar
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <SubmitButton variant="danger" pendingLabel="Limpando...">
              Confirmar limpeza
            </SubmitButton>
          </DialogClose>
        </form>
      </DialogContent>
    </Dialog>
  );
}
