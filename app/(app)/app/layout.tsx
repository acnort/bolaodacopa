import { AppShell } from "@/components/app-shell";
import { getCurrentUser } from "@/lib/services/app-service";

export default async function PrivateLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentUser = await getCurrentUser();

  return (
    <AppShell userName={currentUser.fullName} userRole={currentUser.role}>
      {children}
    </AppShell>
  );
}
