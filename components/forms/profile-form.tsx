"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, KeyRound, Save } from "lucide-react";
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
  const avatarFormRef = useRef<HTMLFormElement>(null);
  const passwordFormRef = useRef<HTMLFormElement>(null);
  const [avatarState, avatarFormAction] = useActionState(
    updateCurrentProfile,
    initialState,
  );
  const [passwordState, passwordFormAction] = useActionState(
    updateCurrentProfile,
    initialState,
  );
  const [previewUrl, setPreviewUrl] = useState<string>();

  useEffect(() => {
    if (!avatarState.message) return;

    toast[avatarState.ok ? "success" : "error"](avatarState.message);

    if (avatarState.ok) {
      avatarFormRef.current?.reset();
      router.refresh();
    }
  }, [avatarState, router]);

  useEffect(() => {
    if (!passwordState.message) return;

    toast[passwordState.ok ? "success" : "error"](passwordState.message);

    if (passwordState.ok) {
      passwordFormRef.current?.reset();
      router.refresh();
    }
  }, [passwordState, router]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
      <Card>
        <form ref={avatarFormRef} action={avatarFormAction}>
          <CardHeader>
            <CardTitle>Foto do perfil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center gap-4 text-center">
              <label className="group relative cursor-pointer rounded-full focus-within:ring-2 focus-within:ring-[color:var(--accent-strong)] focus-within:ring-offset-2 focus-within:ring-offset-[color:var(--surface-base)] focus-within:outline-none">
                <UserAvatar
                  name={user.fullName}
                  avatarUrl={previewUrl ?? user.avatarUrl}
                  className="h-28 w-28 text-2xl transition group-hover:brightness-75"
                />
                <span className="absolute inset-0 grid place-items-center rounded-full bg-[color:var(--avatar-overlay)] text-[color:var(--text-on-overlay)] opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100">
                  <Camera className="h-6 w-6" />
                </span>
                <span className="sr-only">Alterar foto do perfil</span>
                <input
                  name="avatar"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="sr-only"
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
              </label>

              <div className="w-full space-y-3">
                <p className="mx-auto max-w-[220px] text-sm text-[color:var(--text-muted)]">
                  Clique na foto para enviar PNG, JPG, WEBP ou GIF até 3 MB.
                </p>
                <FormFeedback field="avatar" state={avatarState} />
                <SubmitButton
                  className="w-full"
                  pendingLabel="Salvando perfil..."
                >
                  <Save className="h-4 w-4" />
                  Salvar perfil
                </SubmitButton>
              </div>
            </div>
            <FormFeedback state={avatarState} />
          </CardContent>
        </form>
      </Card>

      <Card>
        <form ref={passwordFormRef} action={passwordFormAction}>
          <CardHeader>
            <CardTitle>Redefinir senha</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-3">
                <label className="flex h-5 items-center gap-2 text-sm font-medium text-[color:var(--text-strong)]">
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
                <FormFeedback field="password" state={passwordState} />
              </div>

              <div className="space-y-3">
                <label className="flex h-5 items-center gap-2 text-sm font-medium text-[color:var(--text-strong)]">
                  <KeyRound className="h-4 w-4 opacity-0" aria-hidden="true" />
                  Confirmar nova senha
                </label>
                <Input
                  name="confirmPassword"
                  type="password"
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Repita a nova senha"
                />
                <FormFeedback field="confirmPassword" state={passwordState} />
              </div>
            </div>

            <FormFeedback state={passwordState} />

            <SubmitButton
              className="w-full md:w-auto"
              pendingLabel="Redefinindo senha..."
            >
              <KeyRound className="h-4 w-4" />
              Redefinir senha
            </SubmitButton>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
