"use client";

import { useSyncExternalStore } from "react";
import type { AppSnapshot } from "@/lib/domain/types";

export const SANDBOX_ENABLED_KEY = "bolao:sandbox:enabled";
export const SANDBOX_SNAPSHOT_KEY = "bolao:sandbox:snapshot:v2";
const SANDBOX_CHANGE_EVENT = "bolao:sandbox-change";
let cachedRawSnapshot: string | null | undefined;
let cachedParsedSnapshot: AppSnapshot | undefined;

function emitSandboxChange() {
  window.dispatchEvent(new Event(SANDBOX_CHANGE_EVENT));
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(SANDBOX_CHANGE_EVENT, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(SANDBOX_CHANGE_EVENT, callback);
  };
}

function getEnabledSnapshot() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(SANDBOX_ENABLED_KEY) === "true";
}

export function useSandboxEnabled() {
  return useSyncExternalStore(subscribe, getEnabledSnapshot, () => false);
}

export function setSandboxEnabled(enabled: boolean) {
  if (enabled) {
    window.localStorage.setItem(SANDBOX_ENABLED_KEY, "true");
  } else {
    window.localStorage.removeItem(SANDBOX_ENABLED_KEY);
  }

  emitSandboxChange();
}

export function notifySandboxChanged() {
  emitSandboxChange();
}

function getSnapshotFromStorage() {
  if (typeof window === "undefined") return undefined;
  if (!getEnabledSnapshot()) return undefined;

  const raw = window.localStorage.getItem(SANDBOX_SNAPSHOT_KEY);
  if (!raw) return undefined;
  if (raw === cachedRawSnapshot) return cachedParsedSnapshot;

  try {
    cachedRawSnapshot = raw;
    cachedParsedSnapshot = JSON.parse(raw) as AppSnapshot;
    return cachedParsedSnapshot;
  } catch {
    cachedRawSnapshot = raw;
    cachedParsedSnapshot = undefined;
    return undefined;
  }
}

export function useSandboxSnapshot() {
  return useSyncExternalStore(
    subscribe,
    getSnapshotFromStorage,
    () => undefined,
  );
}
