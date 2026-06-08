"use client";

import { useActionState, useEffect, useState } from "react";
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
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(
    clearOfficialResults,
    initialState,
  );

  useEffect(() => {
    if (!state.message) return;
    toast[state.ok ? "success" : "error"](state.message);

    if (state.ok) {
      const timeout = window.setTimeout(() => setOpen(false), 0);
      return () => window.clearTimeout(timeout);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="danger" disabled={disabled}>
          <Trash2 className="h-4 w-4" />
          Resetar resultados
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resetar resultados?</DialogTitle>
          <DialogDescription>
            Esta ação apaga placares oficiais, limpa o pódio publicado e
            recalcula o ranking do zero.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="mt-6 flex justify-end gap-3">
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Cancelar
            </Button>
          </DialogClose>
          <SubmitButton variant="danger" pendingLabel="Resetando...">
            Confirmar reset
          </SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
