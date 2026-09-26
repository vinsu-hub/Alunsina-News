"use client";
// Typed wrappers over the shared pref store for personalization pages.
import { useEffect, useState } from "react";
import { PREF_KEYS, usePref } from "@/lib/prefs";
import type { LanguageId, RegionId, SourceTypeId } from "@/lib/taxonomy";

export interface AreaPlace {
  key: string;
  name: string;
  province: string;
  region: RegionId;
}

export interface Following {
  topics: string[];
  regions: RegionId[];
  sources: SourceTypeId[]; // source types
}

const NO_AREAS: AreaPlace[] = [];
const NO_IDS: string[] = [];
const NO_LANGS: LanguageId[] = [];
export const EMPTY_FOLLOWING: Following = { topics: [], regions: [], sources: [] };

/** Validates whatever is in storage — it may be stale, hand-edited, or from an older version. */
function asAreas(v: unknown): AreaPlace[] {
  if (!Array.isArray(v)) return NO_AREAS;
  return v.filter(
    (p): p is AreaPlace =>
      !!p && typeof p === "object" && typeof p.name === "string" && typeof p.region === "string" && typeof p.province === "string",
  );
}
function asFollowing(v: unknown): Following {
  if (!v || typeof v !== "object") return EMPTY_FOLLOWING;
  const o = v as Partial<Record<keyof Following, unknown>>;
  const arr = <T,>(x: unknown) => (Array.isArray(x) ? (x.filter((s) => typeof s === "string") as T[]) : []);
  return { topics: arr<string>(o.topics), regions: arr<RegionId>(o.regions), sources: arr<SourceTypeId>(o.sources) };
}
const asIds = (v: unknown) => (Array.isArray(v) ? (v.filter((s) => typeof s === "string") as string[]) : NO_IDS);

export function useAreas() {
  const [raw, set, ready] = usePref<unknown>(PREF_KEYS.area, NO_AREAS);
  return [asAreas(raw), set as (v: AreaPlace[]) => void, ready] as const;
}
export function useFollowing() {
  const [raw, set, ready] = usePref<unknown>(PREF_KEYS.following, EMPTY_FOLLOWING);
  return [asFollowing(raw), set as (v: Following) => void, ready] as const;
}
export function useSaved() {
  const [raw, set, ready] = usePref<unknown>(PREF_KEYS.saved, NO_IDS);
  return [asIds(raw), set as (v: string[]) => void, ready] as const;
}
export function useLanguages() {
  const [raw, set, ready] = usePref<unknown>(PREF_KEYS.languages, NO_LANGS);
  return [asIds(raw) as LanguageId[], set as (v: LanguageId[]) => void, ready] as const;
}

/**
 * Fetches JSON for a URL (null = nothing to fetch). State is keyed by URL so a
 * change of URL reads as "loading" without a synchronous setState in the effect.
 */
export function useJson<T>(url: string | null) {
  const [state, setState] = useState<{ url: string; data: T | null; error: boolean } | null>(null);
  useEffect(() => {
    if (!url) return;
    let live = true;
    fetch(url)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data: T) => live && setState({ url, data, error: false }))
      .catch(() => live && setState({ url, data: null, error: true }));
    return () => {
      live = false;
    };
  }, [url]);
  const current = state && state.url === url ? state : null;
  return { data: current?.data ?? null, error: current?.error ?? false, loading: !!url && !current };
}
