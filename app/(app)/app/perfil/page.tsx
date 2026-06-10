import { redirect } from "next/navigation";

import { ProfileForm } from "@/components/forms/profile-form";
import { getCurrentUser } from "@/lib/services/app-service";

export default async function ProfilePage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/entrar");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-[color:var(--text-strong)]">
          Perfil
        </h1>
        <p className="text-sm text-[color:var(--text-muted)]">
          Atualize sua foto e redefina sua senha de acesso.
        </p>
      </div>

      <ProfileForm user={currentUser} />
    </div>
  );
}
