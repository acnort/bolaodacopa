"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, KeyRound, Save } from "lucide-react";
import { toast } from "sonner";

import { updateCurrentProfile } from "@/app/actions";
import { FormFeedback } from "@/components/forms/form-feedback";
import { SubmitButton } from "@/components/forms/submit-button";
import { UserAvatar } from "@/components/user-avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ActionResult, Profile } from "@/lib/domain/types";

const initialState: ActionResult<{ updatedId: string }> = {
  ok: false,
  message: "",
};

export function ProfileForm({ user }: { user: Profile }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(
    updateCurrentProfile,
    initialState,
  );
  const [previewUrl, setPreviewUrl] = useState<string>();

  useEffect(() => {
    if (!state.message) return;

    toast[state.ok ? "success" : "error"](state.message);

    if (state.ok) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [router, state]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <form ref={formRef} action={formAction} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Foto do perfil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <UserAvatar
              name={user.fullName}
              avatarUrl={previewUrl ?? user.avatarUrl}
              className="h-24 w-24 text-2xl"
            />
            <div className="min-w-0 flex-1 space-y-3">
              <label className="flex items-center gap-2 text-sm font-medium text-[color:var(--text-strong)]">
                <ImagePlus className="h-4 w-4" />
                Imagem
              </label>
              <Input
                name="avatar"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0];
                  if (!file) {
                    setPreviewUrl(undefined);
                    return;
                  }

                  setPreviewUrl((current) => {
                    if (current) URL.revokeObjectURL(current);
                    return URL.createObjectURL(file);
                  });
                }}
              />
              <p className="text-sm text-[color:var(--text-muted)]">
                PNG, JPG, WEBP ou GIF. Tamanho máximo de 3 MB.
              </p>
              <FormFeedback field="avatar" state={state} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Redefinir senha</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-medium text-[color:var(--text-strong)]">
                <KeyRound className="h-4 w-4" />
                Nova senha
              </label>
              <Input
                name="password"
                type="password"
                minLength={8}
                autoComplete="new-password"
                placeholder="Mínimo de 8 caracteres"
              />
              <FormFeedback field="password" state={state} />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-[color:var(--text-strong)]">
                Confirmar nova senha
              </label>
              <Input
                name="confirmPassword"
                type="password"
                minLength={8}
                autoComplete="new-password"
                placeholder="Repita a nova senha"
              />
              <FormFeedback field="confirmPassword" state={state} />
            </div>
          </div>

          <FormFeedback state={state} />

          <SubmitButton pendingLabel="Salvando perfil...">
            <Save className="h-4 w-4" />
            Salvar perfil
          </SubmitButton>
        </CardContent>
      </Card>
    </form>
  );
}
