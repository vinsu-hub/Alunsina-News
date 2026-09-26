// Read helpers for Explore, Topics, Regions, Languages, Sources, Search, Blindspots.
// Builds on lib/queries.ts; only aggregate counts that the shared module lacks live here.
import "server-only";
import { getDb } from "@/db/client";
import {
  ISLAND_GROUPS,
  LANGUAGES,
  REGIONS,
  SOURCE_TYPE_IDS,
  TOPICS,
  topicSlug,
  type IslandGroupId,
  type LanguageId,
  type RegionId,
  type SourceTypeId,
} from "@/lib/taxonomy";
import { getSource, listSources } from "@/lib/queries";
import type { Article, Evidence } from "@/lib/types";

type Row = Record<string, unknown>;
const all = (sql: string, ...p: (string | number)[]) => getDb().prepare(sql).all(...p) as Row[];
const sinceIso = (hours: number) => new Date(Date.now() - hours * 3600_000).toISOString();

/* ---------- places ---------- */

export type PlaceId = RegionId | IslandGroupId | "national";

export interface Place {
  id: PlaceId;
  kind: "national" | "island" | "region";
  label: string;
  name: string;
  island: IslandGroupId | null;
  regionIds: RegionId[];
}

export function getPlace(id: string): Place | null {
  if (id === "national")
    return {
      id: "national",
      kind: "national",
      label: "National",
      name: "Nationwide coverage",
      island: null,
      regionIds: REGIONS.map((r) => r.id),
    };
  const g = ISLAND_GROUPS.find((x) => x.id === id);
  if (g)
    return {
      id: g.id,
      kind: "island",
      label: g.label,
      name: `${g.label} island group`,
      island: g.id,
      regionIds: REGIONS.filter((r) => r.island === g.id).map((r) => r.id),
    };
  const r = REGIONS.find((x) => x.id === id);
  if (r) return { id: r.id, kind: "region", label: r.label, name: r.name, island: r.island, regionIds: [r.id] };
  return null;
}

/* ---------- index counts ---------- */

/** Every topic (taxonomy + any extra topic seen in the data) with its story count. */
export function topicIndex(): { topic: string; slug: string; stories: number }[] {
  const counts = new Map<string, number>();
  for (const t of TOPICS) counts.set(t, 0);
  for (const r of all(`SELECT topic, COUNT(*) n FROM stories GROUP BY topic`)) {
    const known = [...counts.keys()].find((k) => k.toLowerCase() === String(r.topic).toLowerCase());
    const key = known ?? (r.topic as string);
    counts.set(key, (counts.get(key) ?? 0) + (r.n as number));
  }
  return [...counts]
    .map(([topic, stories]) => ({ topic, slug: topicSlug(topic), stories }))
    .sort((a, b) => a.topic.localeCompare(b.topic));
}

export function topicFromSlug(slug: string): string | null {
  return topicIndex().find((t) => t.slug === slug)?.topic ?? null;
}

/** Distinct stories touching each region (via region-tagged articles), plus island + national totals. */
export function placeStoryCounts() {
  const byRegion = new Map<string, number>(
    all(
      `SELECT region, COUNT(DISTINCT story_id) n FROM articles
       WHERE region IS NOT NULL AND story_id IS NOT NULL GROUP BY region`,
    ).map((r) => [r.region as string, r.n as number]),
  );
  const byIsland = new Map<string, number>();
  for (const g of ISLAND_GROUPS) {
    const ids = REGIONS.filter((r) => r.island === g.id).map((r) => r.id);
    const row = all(
      `SELECT COUNT(DISTINCT story_id) n FROM articles
       WHERE story_id IS NOT NULL AND region IN (${ids.map(() => "?").join(",")})`,
      ...ids,
    )[0];
    byIsland.set(g.id, (row?.n as number) ?? 0);
  }
  const national = (all(
    `SELECT COUNT(DISTINCT a.story_id) n FROM articles a JOIN sources s ON s.id = a.source_id
     WHERE a.story_id IS NOT NULL AND s.type = 'national'`,
  )[0]?.n as number) ?? 0;
  return {
    national,
    island: (id: IslandGroupId) => byIsland.get(id) ?? 0,
    region: (id: RegionId) => byRegion.get(id) ?? 0,
  };
}

/** Article and story counts per language, for all nine languages. */
export function languageCounts(): { id: LanguageId; label: string; articles: number; stories: number }[] {
  const rows = new Map(
    all(`SELECT language, COUNT(*) n, COUNT(DISTINCT story_id) st FROM articles GROUP BY language`).map((r) => [
      r.language as string,
      r,
    ]),
  );
  return LANGUAGES.map((l) => ({
    id: l.id,
    label: l.label,
    articles: (rows.get(l.id)?.n as number) ?? 0,
    stories: (rows.get(l.id)?.st as number) ?? 0,
  }));
}

/** Active source count per source type (all eight, zeros included). */
export function sourceTypeCounts(): Record<SourceTypeId, number> {
  const out = Object.fromEntries(SOURCE_TYPE_IDS.map((t) => [t, 0])) as Record<SourceTypeId, number>;
  for (const r of all(`SELECT type, COUNT(*) n FROM sources WHERE active = 1 GROUP BY type`))
    if (r.type as string in out) out[r.type as SourceTypeId] = r.n as number;
  return out;
}

/** Region and language facets for a topic (distinct stories), for the topic sidebar. */
export function topicFacets(topic: string) {
  const regions = all(
    `SELECT a.region, COUNT(DISTINCT a.story_id) n FROM articles a JOIN stories st ON st.id = a.story_id
     WHERE lower(st.topic) = lower(?) AND a.region IS NOT NULL GROUP BY a.region`,
    topic,
  );
  const languages = all(
    `SELECT a.language, COUNT(DISTINCT a.story_id) n FROM articles a JOIN stories st ON st.id = a.story_id
     WHERE lower(st.topic) = lower(?) GROUP BY a.language`,
    topic,
  );
  return {
    regions: new Map(regions.map((r) => [r.region as RegionId, r.n as number])),
    languages: new Map(languages.map((r) => [r.language as LanguageId, r.n as number])),
  };
}

/* ---------- region comparison ---------- */

/**
 * Approximate resident population by region, from the PSA 2020 Census of Population and Housing.
 * Region VI and Region VII figures exclude the provinces moved into the Negros Island Region
 * (Negros Occidental incl. Bacolod City, Negros Oriental, Siquijor), which is summed from those provinces.
 */
export const REGION_POPULATION_2020: Record<RegionId, number> = {
  ncr: 13_484_462,
  car: 1_797_660,
  r1: 5_301_139,
  r2: 3_685_744,
  r3: 12_422_172,
  r4a: 16_195_042,
  r4b: 3_228_558,
  r5: 6_082_165,
  r6: 4_730_768,
  nir: 4_760_340,
  r7: 6_545_603,
  r8: 4_547_150,
  r9: 3_875_576,
  r10: 5_022_768,
  r11: 5_243_536,
  r12: 4_901_486,
  r13: 2_804_788,
  barmm: 4_404_288,
};

export interface RegionComparison {
  windowLabel: string;
  totalTagged: number;
  placeArticles: number;
  share: number;
  equalShare: number;
  populationShare: number;
}

/**
 * This place's share of region-tagged articles in the most recent window that has data
 * (last 24h, else 72h, else everything in the edition), against two labelled baselines.
 */
export function regionComparison(regionIds: RegionId[]): RegionComparison {
  const windows: [number | null, string][] = [
    [24, "the last 24 hours"],
    [72, "the last 3 days"],
    [null, "all articles in this edition"],
  ];
  let rows: Row[] = [];
  let windowLabel = windows[0][1];
  for (const [h, label] of windows) {
    rows = h
      ? all(`SELECT region, COUNT(*) n FROM articles WHERE region IS NOT NULL AND published_at >= ? GROUP BY region`, sinceIso(h))
      : all(`SELECT region, COUNT(*) n FROM articles WHERE region IS NOT NULL GROUP BY region`);
    windowLabel = label;
    if (rows.length) break;
  }
  const counts = new Map(rows.map((r) => [r.region as string, r.n as number]));
  const totalTagged = [...counts.values()].reduce((a, b) => a + b, 0);
  const placeArticles = regionIds.reduce((a, id) => a + (counts.get(id) ?? 0), 0);
  const popTotal = Object.values(REGION_POPULATION_2020).reduce((a, b) => a + b, 0);
  const popPlace = regionIds.reduce((a, id) => a + REGION_POPULATION_2020[id], 0);
  return {
    windowLabel,
    totalTagged,
    placeArticles,
    share: totalTagged ? placeArticles / totalTagged : 0,
    equalShare: regionIds.length / REGIONS.length,
    populationShare: popPlace / popTotal,
  };
}

/* ---------- sources & local reporting ---------- */

/** Sources whose primary coverage area includes any of these regions. */
export function sourcesInRegions(regionIds: RegionId[], types?: SourceTypeId[]) {
  return listSources().filter(
    (s) => s.regions.some((r) => regionIds.includes(r)) && (!types || types.includes(s.type)),
  );
}

/** Recent articles from regional and community outlets based in these regions. */
export function localReporting(regionIds: RegionId[], limit = 8): Article[] {
  return sourcesInRegions(regionIds, ["regional", "community"])
    .flatMap((s) => getSource(s.id)?.recentArticles ?? [])
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, limit);
}

/** Evidence (primary documents, statements, datasets) linked to stories this source covered. */
export function evidenceForSource(sourceId: string, limit = 8): (Evidence & { storyId: string })[] {
  return all(
    `SELECT DISTINCT e.* FROM evidence e
     WHERE e.story_id IN (SELECT story_id FROM articles WHERE source_id = ? AND story_id IS NOT NULL)
     ORDER BY e.published_at DESC LIMIT ?`,
    sourceId,
    limit,
  ).map((e) => ({
    kind: e.kind as Evidence["kind"],
    title: e.title as string,
    publisher: e.publisher as string,
    url: e.url as string,
    publishedAt: (e.published_at as string) ?? null,
    storyId: e.story_id as string,
  }));
}
