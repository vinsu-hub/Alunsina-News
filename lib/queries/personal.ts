// Personalization reads: My Area feed, saved stories, following feed (§18, Phase 05).
import "server-only";
import { getDb } from "@/db/client";
import { getStory, listSources, listStories } from "@/lib/queries";
import { CITIES, PROVINCES } from "@/lib/gazetteer";
import { REGIONS, SOURCE_TYPE_IDS, TOPICS, type RegionId, type SourceTypeId } from "@/lib/taxonomy";
import type { Source, StorySummary } from "@/lib/types";

type Row = Record<string, unknown>;
const all = async (sql: string, ...p: (string | number)[]) => (await (await getDb()).query(sql, [...p])) as Row[];
const sinceIso = (hours: number) => new Date(Date.now() - hours * 3600_000).toISOString();

/** My Area looks at the last 72 hours of reporting; every empty state says so. */
export const AREA_WINDOW_HOURS = 72;
const MAX = 40;

export const isRegionId = (x: string): x is RegionId => REGIONS.some((r) => r.id === x);
export const isSourceTypeId = (x: string): x is SourceTypeId =>
  (SOURCE_TYPE_IDS as string[]).includes(x);
export const isTopic = (x: string) => TOPICS.some((t) => t.toLowerCase() === x.toLowerCase());

/**
 * Story summaries for explicit ids, in the given order; unknown ids are dropped.
 * (lib/queries.ts keeps its summary mapper private, so this goes through getStory
 * and trims to the StorySummary shape.)
 */
export async function getStorySummaries(ids: string[]): Promise<StorySummary[]> {
  const out: StorySummary[] = [];
  for (const id of [...new Set(ids)].slice(0, 100)) {
    const d = await getStory(id);
    if (!d) continue;
    out.push({
      id: d.id,
      title: d.title,
      summary: d.summary,
      status: d.status,
      topic: d.topic,
      updatedAt: d.updatedAt,
      stats: d.stats,
      leadSource: d.leadSource,
      leadImage: d.leadImage,
    });
  }
  return out;
}

/** Words to look for in headlines/excerpts: place name, its aliases, its province. */
function placeTerms(place: string, province: string): string[] {
  const clean = (s: string) => s.replace(/\s*\(.*?\)\s*/g, " ").trim();
  const city = CITIES.find((c) => c.name === place && c.province === province);
  const prov = PROVINCES.find((p) => p.name === province);
  const terms = [
    clean(place),
    ...(city?.aliases ?? []),
    province === "Quezon Province" ? "Quezon Province" : clean(province),
    ...(prov?.aliases ?? []).filter((a) => a !== "Quezon"), // "Quezon" alone would match Quezon City
  ];
  return [...new Set(terms.map((t) => t.trim()).filter((t) => t.length >= 3))];
}

function mergeRanked(lists: StorySummary[][]): StorySummary[] {
  const seen = new Map<string, StorySummary>();
  for (const l of lists) for (const s of l) if (!seen.has(s.id)) seen.set(s.id, s);
  return [...seen.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export interface AreaFeed {
  region: RegionId;
  windowHours: number;
  local: StorySummary[];
  regional: StorySummary[];
  government: StorySummary[];
  community: StorySummary[];
  sources: (Source & { articleCount: number })[];
}

/**
 * - local: stories with an article tagged to the region whose headline/excerpt names the city or province
 * - regional: other stories touching the region (disjoint from local)
 * - government: stories with Government / State-Run / Primary reporting tagged to the region
 * - community: stories with Community-source reporting tagged to the region
 */
export async function getPersonalAreaFeed(region: RegionId, place: string, province: string): Promise<AreaFeed> {
  const since = sinceIso(AREA_WINDOW_HOURS);
  const terms = placeTerms(place, province);
  const localIds = terms.length
    ? (await all(
        `SELECT DISTINCT a.story_id id FROM articles a JOIN stories st ON st.id = a.story_id
         WHERE a.region = $1 AND st.updated_at >= $2
           AND (${terms.map((_, i) => `(a.headline ILIKE $${3 + i * 2} OR a.excerpt ILIKE $${4 + i * 2})`).join(" OR ")})`,
        region,
        since,
        ...terms.flatMap((t) => [`%${t}%`, `%${t}%`]),
      )).map((r) => r.id as string)
    : [];
  const local = (await getStorySummaries(localIds)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const localSet = new Set(localIds);
  const inRegion = await listStories({ region, sinceHours: AREA_WINDOW_HOURS, limit: MAX });
  const regional = inRegion.filter((s) => !localSet.has(s.id));
  const government = mergeRanked(await Promise.all(
    (["government", "state", "primary"] as const).map(async (t) =>
      (await listStories({ region, sourceType: t, sinceHours: AREA_WINDOW_HOURS, limit: MAX })),
    ),
  ));
  const community = await listStories({ region, sourceType: "community", sinceHours: AREA_WINDOW_HOURS, limit: MAX });
  const sources = (await listSources())
    .filter((s) => s.regions.includes(region))
    .sort((a, b) => b.articleCount - a.articleCount || a.name.localeCompare(b.name));
  return { region, windowHours: AREA_WINDOW_HOURS, local, regional, government, community, sources };
}

/** Stories matching any followed topic, region, or source type (OR), newest first. */
export async function getFollowingFeed(f: { topics: string[]; regions: RegionId[]; sourceTypes: SourceTypeId[] }) {
  const lists = await Promise.all([
    ...f.topics.map(async (topic) => (await listStories({ topic, limit: MAX }))),
    ...f.regions.map(async (region) => (await listStories({ region, limit: MAX }))),
    ...f.sourceTypes.map(async (sourceType) => (await listStories({ sourceType, limit: MAX }))),
  ]);
  return mergeRanked(lists).slice(0, 60);
}
