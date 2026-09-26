// Story-page helpers. Pure functions — safe in server and client components.
import { SOURCE_TYPE_IDS, type SourceTypeId } from "@/lib/taxonomy";
import type { Article } from "@/lib/types";

const TZ = "Asia/Manila";

/** "2026-09-26" in Manila time — used to detect when a timeline crosses days. */
export const manilaDayKey = (iso: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));

/** "Fri, Sep 26" in Manila time. */
export const dayLabel = (iso: string) =>
  new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short", month: "short", day: "numeric" }).format(new Date(iso));

/** "Sep 26, 08:30" in Manila time. */
export const dateTime = (iso: string) =>
  new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(iso));

/** Articles grouped by source type in the canonical 9-type order; empty types omitted. */
export function groupByType(articles: Article[]): { type: SourceTypeId; articles: Article[] }[] {
  return SOURCE_TYPE_IDS.map((type) => ({ type, articles: articles.filter((a) => a.source.type === type) })).filter(
    (g) => g.articles.length > 0,
  );
}

/**
 * Order for default compare panes: alternate between "official" and "ground-level"
 * types so the first panes are maximally different (Government vs. Regional, then
 * Independent…). Social / Viral is last — it is not reporting.
 */
export const COMPARE_ORDER: SourceTypeId[] = [
  "government",
  "regional",
  "independent",
  "journalist",
  "national",
  "state",
  "community",
  "primary",
  "social",
];

export const earliest = (articles: Article[]) =>
  articles.reduce<string | null>((min, a) => (!min || a.publishedAt < min ? a.publishedAt : min), null);
