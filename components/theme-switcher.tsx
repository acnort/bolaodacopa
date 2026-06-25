"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { ComponentType } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

import { cn } from "@/lib/utils";

const storageKey = "bolao-theme";
const themePreferences = ["light", "dark", "system"] as const;

type ThemePreference = (typeof themePreferences)[number];

const themeOptions: {
  value: ThemePreference;
  label: string;
  icon: ComponentType<{ className?: string }>;
}[] = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Escuro", icon: Moon },
  { value: "system", label: "Sistema", icon: Monitor },
];

const themeChangeEvent = "bolao-theme-change";

function isThemePreference(value: string | null): value is ThemePreference {
  return themePreferences.some((theme) => theme === value);
}

function getStoredTheme(): ThemePreference {
  if (typeof window === "undefined") return "system";

  try {
    const storedTheme = window.localStorage.getItem(storageKey);
    return isThemePreference(storedTheme) ? storedTheme : "system";
  } catch {
    return "system";
  }
}

function getResolvedTheme(theme: ThemePreference) {
  if (theme !== "system") return theme;

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyThemePreference(theme: ThemePreference) {
  if (typeof document === "undefined") return;

  const resolvedTheme = getResolvedTheme(theme);
  const root = document.documentElement;

  root.dataset.theme = theme;
  root.dataset.resolvedTheme = resolvedTheme;
  root.style.colorScheme = resolvedTheme;

  try {
    window.localStorage.setItem(storageKey, theme);
  } catch {
    // Keep the DOM theme even when storage is blocked.
  }

  window.dispatchEvent(new Event(themeChangeEvent));
}

function subscribeToThemeChanges(onStoreChange: () => void) {
  window.addEventListener(themeChangeEvent, onStoreChange);
  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener(themeChangeEvent, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function getThemeSnapshot() {
  return getStoredTheme();
}

export function ThemeSwitcher({ className }: { className?: string }) {
  const theme = useSyncExternalStore(
    subscribeToThemeChanges,
    getThemeSnapshot,
    () => "system",
  );

  useEffect(() => {
    const storedTheme = getStoredTheme();
    applyThemePreference(storedTheme);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = () => {
      if (document.documentElement.dataset.theme === "system") {
        applyThemePreference("system");
      }
    };

    mediaQuery.addEventListener("change", handleSystemThemeChange);
    return () => {
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
    };
  }, []);

  function selectTheme(nextTheme: ThemePreference) {
    applyThemePreference(nextTheme);
  }

  return (
    <div
      className={cn(
        "inline-grid w-fit grid-cols-3 gap-0.5 rounded-lg border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] p-0.5",
        className,
      )}
      role="radiogroup"
      aria-label="Tema"
    >
      {themeOptions.map((option) => {
        const Icon = option.icon;
        const active = theme === option.value;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            title={option.label}
            onClick={() => selectTheme(option.value)}
            className={cn(
              "grid h-8 w-8 cursor-pointer place-items-center rounded-md text-[color:var(--text-muted)] transition focus-visible:ring-2 focus-visible:ring-[color:var(--accent-soft)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--surface-base)] focus-visible:outline-none",
              active
                ? "bg-[color:var(--surface-base)] text-[color:var(--text-strong)] shadow-sm"
                : "hover:bg-[color:var(--surface-subtle)] hover:text-[color:var(--text-strong)]",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="sr-only">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
