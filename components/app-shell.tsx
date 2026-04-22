"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ListChecks, Medal, Menu, Shield } from "lucide-react";

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
}: {
  currentPath: string;
  isAdmin: boolean;
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
  const isAdmin = userRole === "admin";

  return (
    <div className="min-h-screen bg-[color:var(--background)]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px] gap-6 px-4 py-4 md:px-6 xl:px-8">
        <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-64 shrink-0 rounded-xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-elevated)] p-5 shadow-[var(--shadow-card)] lg:flex lg:flex-col">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--text-muted)]">
              Bolão da Copa
            </p>
            <h1 className="mt-3 text-2xl font-semibold text-[color:var(--text-strong)]">
              {userName}
            </h1>
          </div>
          <div className="mt-8 flex-1">
            <NavigationLinks currentPath={pathname} isAdmin={isAdmin} />
          </div>
        </aside>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col gap-6">
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
              <NavigationLinks currentPath={pathname} isAdmin={isAdmin} />
            </DrawerContent>
          </Drawer>

          <main className="pb-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
