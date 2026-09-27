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
import { coverageFromRegionCounts, getSource, listSources } from "@/lib/queries";
import type { Article, Evidence } from "@/lib/types";

type Row = Record<string, unknown>;
const all = async (sql: string, ...p: (string | number)[]) => (await (await getDb()).query(sql, [...p])) as Row[];
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

export async function getPlace(id: string): Promise<Place | null> {
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
export async function topicIndex(): Promise<{ topic: string; slug: string; stories: number }[]> {
  const counts = new Map<string, number>();
  for (const t of TOPICS) counts.set(t, 0);
  for (const r of (await all(`SELECT topic, COUNT(*)::int n FROM public_stories GROUP BY topic`))) {
    const known = [...counts.keys()].find((k) => k.toLowerCase() === String(r.topic).toLowerCase());
    const key = known ?? (r.topic as string);
    counts.set(key, (counts.get(key) ?? 0) + (r.n as number));
  }
  return [...counts]
    .map(([topic, stories]) => ({ topic, slug: topicSlug(topic), stories }))
    .sort((a, b) => a.topic.localeCompare(b.topic));
}

export async function topicFromSlug(slug: string): Promise<string | null> {
  return (await topicIndex()).find((t) => t.slug === slug)?.topic ?? null;
}

/** Specific subjects, ranked by article volume; category indexes remain separate. */
export async function trendingSubjects() {
  const subjects = [
    ["Flood Control", "flood control"],
    ["Rice Prices", "rice prices"],
    ["West Philippine Sea", "West Philippine Sea"],
    ["Dengue", "dengue"],
    ["Coral Bleaching", "coral bleaching"],
    ["Inflation", "inflation"],
    ["EDSA Traffic", "EDSA"],
    ["Class Schedules", "class schedule"],
  ];
  return (await Promise.all(subjects.map(async ([label, query]) => {
    const row = (await all(`SELECT COUNT(DISTINCT st.id)::int stories, COUNT(a.id)::int articles
      FROM public_stories st JOIN public_articles a ON a.story_id = st.id
      WHERE lower(st.title) ILIKE $1`, `%${query.toLowerCase()}%`))[0];
    return { label, query, stories: Number(row.stories), articles: Number(row.articles) };
  }))).filter((s) => s.stories > 0).sort((a, b) => b.articles - a.articles || a.label.localeCompare(b.label));
}

/** Distinct stories touching each region (via region-tagged articles), plus island + national totals. */
export async function placeStoryCounts() {
  const byRegion = new Map<string, number>(
    (await all(
      `SELECT region, COUNT(DISTINCT story_id)::int n FROM public_articles
       WHERE region IS NOT NULL AND story_id IS NOT NULL GROUP BY region`,
    )).map((r) => [r.region as string, r.n as number]),
  );
  const byIsland = new Map<string, number>();
  for (const g of ISLAND_GROUPS) {
    const ids = REGIONS.filter((r) => r.island === g.id).map((r) => r.id);
    const row = (await all(
      `SELECT COUNT(DISTINCT story_id)::int n FROM public_articles
       WHERE story_id IS NOT NULL AND region IN (${ids.map((_, i) => `$${i + 1}`).join(",")})`,
      ...ids,
    ))[0];
    byIsland.set(g.id, (row?.n as number) ?? 0);
  }
  const national = ((await all(
    `SELECT COUNT(DISTINCT a.story_id)::int n FROM public_articles a JOIN sources s ON s.id = a.source_id
     WHERE a.story_id IS NOT NULL AND s.type = 'national'`,
  ))[0]?.n as number) ?? 0;
  return {
    national,
    island: (id: IslandGroupId) => byIsland.get(id) ?? 0,
    region: (id: RegionId) => byRegion.get(id) ?? 0,
  };
}

/** Article and story counts per language, for all nine languages. */
export async function languageCounts(): Promise<{ id: LanguageId; label: string; articles: number; stories: number }[]> {
  const rows = new Map(
    (await all(`SELECT language, COUNT(*)::int n, COUNT(DISTINCT story_id)::int st FROM public_articles GROUP BY language`)).map((r) => [
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
export async function sourceTypeCounts(): Promise<Record<SourceTypeId, number>> {
  const out = Object.fromEntries(SOURCE_TYPE_IDS.map((t) => [t, 0])) as Record<SourceTypeId, number>;
  for (const r of (await all(`SELECT type, COUNT(*)::int n FROM sources WHERE active = 1 GROUP BY type`)))
    if (r.type as string in out) out[r.type as SourceTypeId] = r.n as number;
  return out;
}

/** Region and language facets for a topic (distinct stories), for the topic sidebar. */
export async function topicFacets(topic: string) {
  const regions = await all(
    `SELECT a.region, COUNT(DISTINCT a.story_id)::int n FROM public_articles a JOIN public_stories st ON st.id = a.story_id
     WHERE lower(st.topic) = lower($1) AND a.region IS NOT NULL GROUP BY a.region`,
    topic,
  );
  const languages = await all(
    `SELECT a.language, COUNT(DISTINCT a.story_id)::int n FROM public_articles a JOIN public_stories st ON st.id = a.story_id
     WHERE lower(st.topic) = lower($1) GROUP BY a.language`,
    topic,
  );
  return {
    regions: new Map(regions.map((r) => [r.region as RegionId, r.n as number])),
    languages: new Map(languages.map((r) => [r.language as LanguageId, r.n as number])),
  };
}

/* ---------- region comparison ---------- */

/** Same edition and denominator for the scoped story cohort and national baseline. */
export async function placeCoverage(place: Place) {
  const condition = place.kind === "national"
    ? "SELECT a.story_id FROM public_articles a JOIN sources s ON s.id = a.source_id WHERE s.type = 'national'"
    : `SELECT story_id FROM public_articles WHERE region IN (${place.regionIds.map((_, i) => `$${i + 1}`).join(",")})`;
  const scoped = await all(
    `SELECT region, COUNT(*)::int n FROM public_articles WHERE region IS NOT NULL
     AND story_id IN (${condition}) GROUP BY region`,
    ...(place.kind === "national" ? [] : place.regionIds),
  );
  const baseline = await all(`SELECT region, COUNT(*)::int n FROM public_articles WHERE region IS NOT NULL GROUP BY region`);
  const coverage = async (rows: Row[]) => (await coverageFromRegionCounts(new Map(rows.map((r) => [r.region as string, r.n as number]))));
  return { coverage: await coverage(scoped), compareTo: await coverage(baseline) };
}

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
export async function regionComparison(regionIds: RegionId[]): Promise<RegionComparison> {
  const windows: [number | null, string][] = [
    [24, "the last 24 hours"],
    [72, "the last 3 days"],
    [null, "all articles in this edition"],
  ];
  let rows: Row[] = [];
  let windowLabel = windows[0][1];
  for (const [h, label] of windows) {
    rows = h
      ? (await all(`SELECT region, COUNT(*)::int n FROM public_articles WHERE region IS NOT NULL AND published_at >= $1 GROUP BY region`, sinceIso(h)))
      : (await all(`SELECT region, COUNT(*)::int n FROM public_articles WHERE region IS NOT NULL GROUP BY region`));
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
export async function sourcesInRegions(regionIds: RegionId[], types?: SourceTypeId[]) {
  return (await listSources()).filter(
    (s) => s.regions.some((r) => regionIds.includes(r)) && (!types || types.includes(s.type)),
  );
}

/** Recent articles from regional and community outlets based in these regions. */
export async function localReporting(regionIds: RegionId[], limit = 8): Promise<Article[]> {
  return (await Promise.all((await sourcesInRegions(regionIds, ["regional", "community"]))
    .map(async (s) => (await getSource(s.id))?.recentArticles ?? []))).flat()
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, limit);
}

/** Evidence (primary documents, statements, datasets) linked to stories this source covered. */
export async function evidenceForSource(sourceId: string, limit = 8): Promise<(Evidence & { storyId: string })[]> {
  return (await all(
    `SELECT DISTINCT e.* FROM evidence e
     WHERE e.story_id IN (SELECT story_id FROM public_articles WHERE source_id = $1 AND story_id IS NOT NULL)
     ORDER BY e.published_at DESC LIMIT $2`,
    sourceId,
    limit,
  )).map((e) => ({
    kind: e.kind as Evidence["kind"],
    title: e.title as string,
    publisher: e.publisher as string,
    url: e.url as string,
    publishedAt: (e.published_at as string) ?? null,
    storyId: e.story_id as string,
  }));
}
