import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { getCurrentUser, hasAccessSession } from "@/lib/services/app-service";

export default async function PrivateLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (!(await hasAccessSession())) {
    redirect("/entrar");
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/entrar");
  }

  return (
    <AppShell userName={currentUser.fullName} userRole={currentUser.role}>
      {children}
    </AppShell>
  );
}
