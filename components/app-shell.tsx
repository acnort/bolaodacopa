"use client";

import { startTransition, useOptimistic, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  ClipboardCheck,
  Bot,
  FlaskConical,
  ListChecks,
  LogOut,
  Medal,
  Menu,
  Shield,
  SlidersHorizontal,
  Trophy,
  Users,
} from "lucide-react";

import { signOut } from "@/app/actions";
import { SandboxToggle } from "@/components/sandbox-toggle";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { UserAvatar } from "@/components/user-avatar";
import { cn } from "@/lib/utils";

type NavigationLeaf = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

type NavigationGroup = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavigationLeaf[];
};

type NavigationItem = NavigationLeaf | NavigationGroup;

function isNavigationGroup(item: NavigationItem): item is NavigationGroup {
  return "items" in item;
}

function getLinks(isAdmin: boolean): NavigationItem[] {
  return [
    { href: "/app", label: "Ranking", icon: Medal },
    {
      label: "Jogos",
      icon: ListChecks,
      items: [
        { href: "/app/palpites", label: "Meus palpites", icon: ClipboardList },
        { href: "/app/resultados", label: "Resultados", icon: Trophy },
      ],
    },
    ...(isAdmin
      ? [
          {
            label: "Admin",
            icon: Shield,
            items: [
              {
                href: "/app/admin/regras",
                label: "Regras",
                icon: SlidersHorizontal,
              },
              {
                href: "/app/admin/resultados",
                label: "Resultados",
                icon: Trophy,
              },
              {
                href: "/app/admin/palpites",
                label: "Palpites",
                icon: ClipboardCheck,
              },
              {
                href: "/app/admin/fakes",
                label: "Fakes",
                icon: Bot,
              },
              { href: "/app/admin/membros", label: "Membros", icon: Users },
              {
                href: "/app/admin/sandbox",
                label: "Sandbox",
                icon: FlaskConical,
              },
            ],
          },
        ]
      : []),
  ];
}

function isLinkActive(currentPath: string, href: string) {
  return href === "/app"
    ? currentPath === "/app"
    : currentPath === href || currentPath.startsWith(`${href}/`);
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
      {getLinks(isAdmin).map((link) => {
        const Icon = link.icon;

        if (isNavigationGroup(link)) {
          const groupActive = link.items.some((item) =>
            isLinkActive(currentPath, item.href),
          );

          return (
            <div key={link.label} className="space-y-1">
              <div
                className={cn(
                  "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold",
                  groupActive
                    ? "text-[color:var(--text-strong)]"
                    : "text-[color:var(--text-muted)]",
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{link.label}</span>
              </div>
              <div className="ml-5 space-y-1 border-l border-[color:var(--border-subtle)] pl-3">
                {link.items.map((item) => {
                  const ItemIcon = item.icon;
                  const active = isLinkActive(currentPath, item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => {
                        if (!onNavigate) return;
                        startTransition(() => onNavigate(item.href));
                      }}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                        active
                          ? "bg-[color:var(--accent-strong)] text-white"
                          : "text-[color:var(--text-muted)] hover:bg-[color:var(--surface-muted)] hover:text-[color:var(--text-strong)]",
                      )}
                    >
                      <ItemIcon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        }

        const active = isLinkActive(currentPath, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => {
              if (!onNavigate) return;
              startTransition(() => onNavigate(link.href));
            }}
            className={cn(
              "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition",
              active
                ? "bg-[color:var(--accent-strong)] text-white"
                : "text-[color:var(--text-muted)] hover:bg-[color:var(--surface-muted)] hover:text-[color:var(--text-strong)]",
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{link.label}</span>
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
  userAvatarUrl,
  userName,
  userRole,
}: {
  children: React.ReactNode;
  userAvatarUrl?: string;
  userName: string;
  userRole: string;
}) {
  const pathname = usePathname();
  const [optimisticPath, setOptimisticPath] = useOptimistic(pathname);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAdmin = userRole === "admin" || userRole === "owner";
  const currentPath = optimisticPath;
  const profileActive = isLinkActive(currentPath, "/app/perfil");

  return (
    <div className="min-h-screen bg-[color:var(--background)]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1540px] gap-6 px-3 py-3 sm:px-4 sm:py-4 md:px-6 lg:gap-12 xl:px-8">
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
            {isAdmin ? <SandboxToggle /> : null}
            <Link
              href="/app/perfil"
              onClick={() =>
                startTransition(() => setOptimisticPath("/app/perfil"))
              }
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition",
                profileActive
                  ? "bg-[color:var(--accent-strong)] text-white"
                  : "text-[color:var(--text-strong)] hover:bg-[color:var(--surface-muted)]",
              )}
            >
              <UserAvatar
                name={userName}
                avatarUrl={userAvatarUrl}
                className="h-9 w-9 text-xs"
              />
              <span className="min-w-0 flex-1 truncate">{userName}</span>
            </Link>
            <SignOutForm />
          </div>
        </aside>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col gap-5 sm:gap-6 lg:gap-12">
          <Drawer open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <div className="sticky top-0 z-30 -mx-3 border-b border-[color:var(--border-subtle)] bg-[color:var(--background)]/92 px-3 py-2 backdrop-blur lg:hidden">
              <div className="flex items-center justify-between gap-3">
                <Link
                  href="/app"
                  onClick={() =>
                    startTransition(() => setOptimisticPath("/app"))
                  }
                  className="relative h-11 w-32 shrink-0"
                >
                  <Image
                    src="/logo_h.png"
                    alt="Bolão da Copa"
                    fill
                    sizes="128px"
                    className="object-contain"
                    priority
                  />
                </Link>
                <div className="flex min-w-0 items-center gap-2">
                  <Link
                    href="/app/perfil"
                    onClick={() =>
                      startTransition(() => setOptimisticPath("/app/perfil"))
                    }
                    className={cn(
                      "flex min-w-0 items-center gap-2 rounded-xl px-2 py-1 transition",
                      profileActive
                        ? "bg-[color:var(--accent-muted)]"
                        : "hover:bg-[color:var(--surface-muted)]",
                    )}
                    aria-label="Abrir perfil"
                  >
                    <UserAvatar
                      name={userName}
                      avatarUrl={userAvatarUrl}
                      className="h-8 w-8 text-[10px]"
                    />
                  </Link>
                  <DrawerTrigger asChild>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-10 w-10"
                    >
                      <Menu className="h-5 w-5" />
                      <span className="sr-only">Abrir menu</span>
                    </Button>
                  </DrawerTrigger>
                </div>
              </div>
            </div>
            <DrawerContent className="lg:hidden">
              <Link
                href="/app/perfil"
                onClick={() => {
                  setOptimisticPath("/app/perfil");
                  setMobileMenuOpen(false);
                }}
                className={cn(
                  "mb-4 flex items-center gap-3 rounded-lg px-1 py-2 text-base font-semibold transition",
                  profileActive
                    ? "text-[color:var(--accent-strong-hover)]"
                    : "text-[color:var(--text-strong)]",
                )}
              >
                <UserAvatar
                  name={userName}
                  avatarUrl={userAvatarUrl}
                  className="h-10 w-10 text-sm"
                />
                <span className="min-w-0 flex-1 truncate">{userName}</span>
              </Link>
              <NavigationLinks
                currentPath={currentPath}
                isAdmin={isAdmin}
                onNavigate={(href) => {
                  setOptimisticPath(href);
                  setMobileMenuOpen(false);
                }}
              />
              <div className="mt-3 space-y-3">
                {isAdmin ? <SandboxToggle /> : null}
                <SignOutForm />
              </div>
            </DrawerContent>
          </Drawer>

          <main className="pb-6 sm:pb-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
