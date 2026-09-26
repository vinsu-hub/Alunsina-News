"use client";
// Per-viewer preferences (v1: localStorage). Every access is guarded — storage can be unavailable.
import { useCallback, useMemo, useSyncExternalStore } from "react";

export const PREF_KEYS = {
  saved: "alunsina.saved", // string[] story ids
  following: "alunsina.following", // { topics: string[], sources: string[], regions: string[] }
  area: "alunsina.area", // { key: string, name: string, province: string, region: RegionId }[] (first = primary)
  languages: "alunsina.languages", // LanguageId[]
} as const;

const EVENT = "alunsina:prefs";

export function readPref<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writePref<T>(key: string, value: T) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    memory.set(key, JSON.stringify(value)); // storage unavailable — keep in-memory only
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: key }));
}

function rawPref(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return memory.get(key) ?? null;
  }
}
const memory = new Map<string, string>();

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

/**
 * React hook bound to one pref key; syncs across components and tabs.
 * `ready` is false during SSR/hydration so callers can avoid flashing empty states.
 */
export function usePref<T>(key: string, fallback: T): [T, (v: T) => void, boolean] {
  const raw = useSyncExternalStore(subscribe, () => rawPref(key), () => undefined);
  const value = useMemo<T>(() => {
    if (raw == null) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raw]);
  const set = useCallback((v: T) => writePref(key, v), [key]);
  return [value, set, raw !== undefined];
}
