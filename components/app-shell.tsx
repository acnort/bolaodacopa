"use client";

import { startTransition, useOptimistic } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ListChecks, LogOut, Medal, Menu, Shield } from "lucide-react";

import { signOut } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

function getLinks(isAdmin: boolean) {
  return [
    { href: "/app", label: "Ranking", icon: Medal },
    { href: "/app/palpites", label: "Jogos", icon: ListChecks },
    ...(isAdmin ? [{ href: "/app/admin", label: "Admin", icon: Shield }] : []),
  ];
}

function NavigationLinks({
  currentPath,
  isAdmin,
  onNavigate,
}: {
  currentPath: string;
  isAdmin: boolean;
  onNavigate?: (href: string) => void;
}) {
  return (
    <nav className="flex flex-col gap-2">
      {getLinks(isAdmin).map(({ href, label, icon: Icon }) => {
        const active =
          href === "/app"
            ? currentPath === "/app"
            : currentPath === href || currentPath.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => {
              if (!onNavigate) return;
              startTransition(() => onNavigate(href));
            }}
            className={cn(
              "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition",
              active
                ? "bg-[color:var(--accent-strong)] text-white"
                : "text-[color:var(--text-muted)] hover:bg-[color:var(--surface-muted)] hover:text-[color:var(--text-strong)]",
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function SignOutForm() {
  return (
    <form action={signOut}>
      <Button variant="ghost" className="w-full justify-start">
        <LogOut className="h-4 w-4" />
        Sair
      </Button>
    </form>
  );
}

export function AppShell({
  children,
  userName,
  userRole,
}: {
  children: React.ReactNode;
  userName: string;
  userRole: string;
}) {
  const pathname = usePathname();
  const [optimisticPath, setOptimisticPath] = useOptimistic(pathname);
  const isAdmin = userRole === "admin";
  const currentPath = optimisticPath;

  return (
    <div className="min-h-screen bg-[color:var(--background)]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1540px] gap-12 px-4 py-4 md:px-6 xl:px-8">
        <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-64 shrink-0 rounded-xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-elevated)] p-5 shadow-[var(--shadow-card)] lg:flex lg:flex-col">
          <div className="flex justify-center">
            <div className="relative h-32 w-48 shrink-0">
              <Image
                src="/logo_h.png"
                alt="Bolão da Copa"
                fill
                sizes="192px"
                className="object-contain"
              />
            </div>
          </div>
          <div className="mt-8 flex-1">
            <NavigationLinks
              currentPath={currentPath}
              isAdmin={isAdmin}
              onNavigate={setOptimisticPath}
            />
          </div>
          <div className="space-y-3">
            <p className="truncate px-3 text-sm font-semibold text-[color:var(--text-strong)]">
              {userName}
            </p>
            <SignOutForm />
          </div>
        </aside>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col gap-12">
          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="secondary" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Abrir menu</span>
              </Button>
            </DrawerTrigger>
            <DrawerContent className="lg:hidden">
              <div className="mb-4 px-1 text-base font-semibold text-[color:var(--text-strong)]">
                {userName}
              </div>
              <NavigationLinks
                currentPath={currentPath}
                isAdmin={isAdmin}
                onNavigate={setOptimisticPath}
              />
              <div className="mt-3">
                <SignOutForm />
              </div>
            </DrawerContent>
          </Drawer>

          <main className="pb-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
