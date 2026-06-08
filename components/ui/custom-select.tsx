"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

import { cn } from "@/lib/utils";

export type CustomSelectOption = {
  value: string;
  label: string;
  keywords?: string[];
};

type CustomSelectProps = {
  name: string;
  options: CustomSelectOption[];
  defaultValue?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  align?: "start" | "end";
  listLabel?: string;
  onValueChange?: (value: string) => void;
};

export function CustomSelect({
  name,
  options,
  defaultValue = "",
  placeholder = "Selecionar",
  searchPlaceholder = "Buscar",
  emptyMessage = "Nenhum item encontrado.",
  disabled,
  align = "start",
  listLabel = "Opções",
  onValueChange,
}: CustomSelectProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [value, setValue] = useState(defaultValue);
  const selectedOption = options.find((option) => option.value === value);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredOptions = useMemo(() => {
    if (!normalizedQuery) return options;

    return options.filter((option) =>
      [option.label, ...(option.keywords ?? [])]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [normalizedQuery, options]);

  useEffect(() => {
    if (!open) return;

    const timeout = window.setTimeout(() => searchRef.current?.focus(), 0);

    function handlePointerDown(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !containerRef.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open]);

  function selectOption(optionValue: string) {
    setValue(optionValue);
    setQuery("");
    setOpen(false);
    onValueChange?.(optionValue);
  }

  return (
    <div ref={containerRef} className="relative min-w-0">
      <input type="hidden" name={name} value={value} disabled={disabled} />
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className="flex h-11 w-full min-w-0 items-center justify-between gap-3 rounded-lg border border-[color:var(--border-subtle)] bg-[color:var(--surface-base)] px-4 text-left text-sm text-[color:var(--text-strong)] shadow-sm outline-none transition focus:border-[color:var(--accent-soft)] focus:ring-2 focus:ring-[color:var(--accent-soft)]/20 disabled:cursor-not-allowed disabled:opacity-50"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span
          className={cn(
            "min-w-0 truncate",
            !selectedOption && "text-[color:var(--text-muted)]",
          )}
          title={selectedOption?.label}
        >
          {selectedOption?.label ?? placeholder}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-[color:var(--text-muted)]" />
      </button>

      {open ? (
        <div
          className={cn(
            "absolute top-full z-50 mt-2 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-[color:var(--border-subtle)] bg-[color:var(--surface-base)] shadow-[var(--shadow-card)]",
            align === "end" ? "right-0" : "left-0",
          )}
        >
          <div className="border-b border-[color:var(--border-subtle)] p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--text-muted)]" />
              <input
                ref={searchRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    setOpen(false);
                  }

                  if (event.key === "Enter") {
                    event.preventDefault();
                  }
                }}
                placeholder={searchPlaceholder}
                className="h-10 w-full rounded-md border border-[color:var(--border-subtle)] bg-[color:var(--surface-base)] pl-9 pr-3 text-sm text-[color:var(--text-strong)] outline-none focus:border-[color:var(--accent-soft)] focus:ring-2 focus:ring-[color:var(--accent-soft)]/20"
              />
            </div>
          </div>

          <div
            role="listbox"
            className="max-h-72 overflow-y-auto p-2"
            aria-label={listLabel}
          >
            {filteredOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={option.value === value}
                onClick={() => selectOption(option.value)}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm text-[color:var(--text-strong)] outline-none transition hover:bg-[color:var(--surface-muted)] focus:bg-[color:var(--surface-muted)]"
              >
                <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                  {option.value === value ? <Check className="h-4 w-4" /> : null}
                </span>
                <span className="min-w-0 truncate" title={option.label}>
                  {option.label}
                </span>
              </button>
            ))}

            {filteredOptions.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-[color:var(--text-muted)]">
                {emptyMessage}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
