// Typed read API. Every page reads data through here — never raw SQL in components.
import "server-only";
import { getDb, json } from "@/db/client";
import {
  ISLAND_GROUPS,
  REGIONS,
  type BlindspotTypeId,
  type LanguageId,
  type RegionId,
  type SourceTypeId,
} from "./taxonomy";
import type {
  Angle,
  Article,
  Blindspot,
  Edition,
  Emphasis,
  Evidence,
  FactCheck,
  IslandCoverage,
  RegionCoverage,
  Source,
  SourceProfile,
  StoryDetail,
  StoryStats,
  StorySummary,
  TimelineEvent,
} from "./types";

type Row = Record<string, unknown>;
const db = () => getDb();
const all = (sql: string, ...p: (string | number | null)[]) => db().prepare(sql).all(...p) as Row[];
const one = (sql: string, ...p: (string | number | null)[]) =>
  db().prepare(sql).get(...p) as Row | undefined;

/* ---------- mappers ---------- */

function toSource(r: Row, prefix = ""): Source {
  const c = (k: string) => r[prefix + k];
  return {
    id: c("id") as string,
    name: c("name") as string,
    type: c("type") as SourceTypeId,
    ownership: c("ownership") as string,
    ownershipSource: (c("ownership_source") as string) ?? null,
    dataStatus: c("data_status") as Source["dataStatus"],
    paywalled: Boolean(c("paywalled")),
    homepage: c("homepage") as string,
    feedUrl: (c("feed_url") as string) ?? null,
    regions: json(c("regions"), []),
    languages: json(c("languages"), []),
    topics: json(c("topics"), []),
  };
}

const ARTICLE_SELECT = `
  SELECT a.*, s.id s_id, s.name s_name, s.type s_type, s.ownership s_ownership,
         s.ownership_source s_ownership_source, s.data_status s_data_status, s.paywalled s_paywalled,
         s.homepage s_homepage, s.feed_url s_feed_url, s.regions s_regions, s.languages s_languages,
         s.topics s_topics
  FROM articles a JOIN sources s ON s.id = a.source_id`;

function toArticle(r: Row): Article {
  return {
    id: r.id as string,
    sourceId: r.source_id as string,
    storyId: (r.story_id as string) ?? null,
    headline: r.headline as string,
    byline: (r.byline as string) ?? null,
    url: r.url as string,
    excerpt: r.excerpt as string,
    publishedAt: r.published_at as string,
    language: r.language as LanguageId,
    region: (r.region as RegionId) ?? null,
    source: toSource(r, "s_"),
  };
}

function statsFor(storyIds: string[]): Map<string, StoryStats> {
  const out = new Map<string, StoryStats>();
  if (!storyIds.length) return out;
  const ph = storyIds.map(() => "?").join(",");
  const rows = all(
    `SELECT a.story_id, s.id source_id, s.type, a.region, a.language
     FROM articles a JOIN sources s ON s.id = a.source_id
     WHERE a.story_id IN (${ph})`,
    ...storyIds,
  );
  const acc = new Map<
    string,
    { n: number; src: Map<string, string>; reg: Set<string>; lang: Set<string> }
  >();
  for (const r of rows) {
    const id = r.story_id as string;
    if (!acc.has(id)) acc.set(id, { n: 0, src: new Map(), reg: new Set(), lang: new Set() });
    const a = acc.get(id)!;
    a.n++;
    a.src.set(r.source_id as string, r.type as string);
    if (r.region) a.reg.add(r.region as string);
    a.lang.add(r.language as string);
  }
  for (const id of storyIds) {
    const a = acc.get(id);
    const byType: StoryStats["byType"] = {};
    a?.src.forEach((t) => (byType[t as SourceTypeId] = (byType[t as SourceTypeId] ?? 0) + 1));
    out.set(id, {
      sources: a?.src.size ?? 0,
      articles: a?.n ?? 0,
      regions: a?.reg.size ?? 0,
      languages: a?.lang.size ?? 0,
      byType,
    });
  }
  return out;
}

function leadSources(storyIds: string[]): Map<string, Source> {
  const out = new Map<string, Source>();
  for (const id of storyIds) {
    const r = one(`${ARTICLE_SELECT} WHERE a.story_id = ? ORDER BY a.published_at ASC LIMIT 1`, id);
    if (r) out.set(id, toSource(r, "s_"));
  }
  return out;
}

function toSummaries(rows: Row[]): StorySummary[] {
  const ids = rows.map((r) => r.id as string);
  const stats = statsFor(ids);
  const leads = leadSources(ids);
  return rows.map((r) => ({
    id: r.id as string,
    title: r.title as string,
    summary: r.summary as string,
    status: r.status as StorySummary["status"],
    topic: r.topic as string,
    updatedAt: r.updated_at as string,
    stats: stats.get(r.id as string)!,
    leadSource: leads.get(r.id as string) ?? null,
  }));
}

function toBlindspot(r: Row): Blindspot {
  return {
    id: r.id as number,
    storyId: r.story_id as string,
    storyTitle: (r.story_title as string) ?? "",
    type: r.type as BlindspotTypeId,
    reason: r.reason as string,
    example: r.example as string,
    linkLabel: (r.link_label as string) ?? null,
    linkHref: (r.link_href as string) ?? null,
    detectedAt: r.detected_at as string,
  };
}

/* ---------- coverage ---------- */

export function coverageFromRegionCounts(counts: Map<string, number>): IslandCoverage[] {
  const total = [...counts.values()].reduce((a, b) => a + b, 0) || 1;
  return ISLAND_GROUPS.map((g) => {
    const regions: RegionCoverage[] = REGIONS.filter((r) => r.island === g.id).map((r) => {
      const n = counts.get(r.id) ?? 0;
      return { regionId: r.id, articles: n, share: n / total };
    });
    const n = regions.reduce((a, r) => a + r.articles, 0);
    return { island: g.id, articles: n, share: n / total, regions };
  });
}

/** Region coverage for one story, or platform-wide within the last `sinceHours`. */
export function getRegionCoverage(opts: { storyId?: string; sinceHours?: number } = {}) {
  const rows = opts.storyId
    ? all(
        `SELECT region, COUNT(*) n FROM articles WHERE story_id = ? AND region IS NOT NULL GROUP BY region`,
        opts.storyId,
      )
    : all(
        `SELECT region, COUNT(*) n FROM articles WHERE region IS NOT NULL AND published_at >= ? GROUP BY region`,
        sinceIso(opts.sinceHours ?? 48),
      );
  return coverageFromRegionCounts(new Map(rows.map((r) => [r.region as string, r.n as number])));
}

const sinceIso = (hours: number) => new Date(Date.now() - hours * 3600_000).toISOString();

/* ---------- stories ---------- */

export interface StoryFilter {
  topic?: string;
  region?: RegionId;
  island?: string;
  language?: LanguageId;
  sourceType?: SourceTypeId;
  sourceId?: string;
  sinceHours?: number;
  limit?: number;
  offset?: number;
}

export function listStories(f: StoryFilter = {}): StorySummary[] {
  const where: string[] = ["1=1"];
  const p: (string | number)[] = [];
  if (f.topic) {
    where.push("lower(st.topic) = lower(?)");
    p.push(f.topic);
  }
  if (f.sinceHours) {
    where.push("st.updated_at >= ?");
    p.push(sinceIso(f.sinceHours));
  }
  const articleConds: string[] = [];
  if (f.region) {
    articleConds.push("a.region = ?");
    p.push(f.region);
  }
  if (f.island) {
    const ids = REGIONS.filter((r) => r.island === f.island).map((r) => r.id);
    articleConds.push(`a.region IN (${ids.map(() => "?").join(",")})`);
    p.push(...ids);
  }
  if (f.language) {
    articleConds.push("a.language = ?");
    p.push(f.language);
  }
  if (f.sourceType) {
    articleConds.push("s.type = ?");
    p.push(f.sourceType);
  }
  if (f.sourceId) {
    articleConds.push("s.id = ?");
    p.push(f.sourceId);
  }
  if (articleConds.length) {
    where.push(
      `EXISTS (SELECT 1 FROM articles a JOIN sources s ON s.id = a.source_id
               WHERE a.story_id = st.id AND ${articleConds.join(" AND ")})`,
    );
  }
  p.push(f.limit ?? 30, f.offset ?? 0);
  const rows = all(
    `SELECT st.* FROM stories st WHERE ${where.join(" AND ")}
     ORDER BY st.score DESC, st.updated_at DESC LIMIT ? OFFSET ?`,
    ...p,
  );
  return toSummaries(rows);
}

export function getStory(id: string): StoryDetail | null {
  const r = one(`SELECT * FROM stories WHERE id = ?`, id);
  if (!r) return null;
  const [summary] = toSummaries([r]);
  const articles = all(`${ARTICLE_SELECT} WHERE a.story_id = ? ORDER BY a.published_at DESC`, id).map(
    toArticle,
  );
  const emphasis: Emphasis[] = all(`SELECT * FROM story_emphasis WHERE story_id = ?`, id).map((e) => ({
    sourceType: e.source_type as SourceTypeId,
    points: json(e.points, []),
  }));
  const angles: Angle[] = all(
    `SELECT * FROM story_angles WHERE story_id = ? ORDER BY share DESC`,
    id,
  ).map((a) => ({ angle: a.angle as string, share: a.share as number, note: (a.note as string) ?? null }));
  const blindspots = all(
    `SELECT b.*, st.title story_title FROM blindspots b JOIN stories st ON st.id = b.story_id
     WHERE b.story_id = ? ORDER BY b.detected_at DESC`,
    id,
  ).map(toBlindspot);
  const timeline: TimelineEvent[] = all(
    `SELECT * FROM timeline_events WHERE story_id = ? ORDER BY at ASC`,
    id,
  ).map((t) => ({
    at: t.at as string,
    label: t.label as string,
    sourceType: (t.source_type as SourceTypeId) ?? null,
    articleId: (t.article_id as string) ?? null,
  }));
  const evidence: Evidence[] = all(
    `SELECT * FROM evidence WHERE story_id = ? ORDER BY published_at DESC`,
    id,
  ).map((e) => ({
    kind: e.kind as Evidence["kind"],
    title: e.title as string,
    publisher: e.publisher as string,
    url: e.url as string,
    publishedAt: (e.published_at as string) ?? null,
  }));
  const factChecks = all(`SELECT * FROM fact_checks WHERE story_id = ?`, id).map(toFactCheck);
  const langCounts = new Map<LanguageId, number>();
  for (const a of articles) langCounts.set(a.language, (langCounts.get(a.language) ?? 0) + 1);
  return {
    ...summary,
    createdAt: r.created_at as string,
    articles,
    emphasis,
    angles,
    blindspots,
    timeline,
    evidence,
    factChecks,
    coverage: getRegionCoverage({ storyId: id }),
    languages: [...langCounts].map(([language, n]) => ({ language, articles: n })).sort(
      (a, b) => b.articles - a.articles,
    ),
  };
}

function toFactCheck(r: Row): FactCheck {
  return {
    claim: r.claim as string,
    org: r.org as string,
    rating: (r.rating as string) ?? null,
    url: r.url as string,
    publishedAt: r.published_at as string,
    storyId: (r.story_id as string) ?? null,
  };
}

/* ---------- blindspots ---------- */

/** Current blindspots, newest first. Each is tied to a real story (§13 fix). */
export function listBlindspots(opts: { type?: BlindspotTypeId; limit?: number } = {}): Blindspot[] {
  const p: (string | number)[] = [];
  let where = "1=1";
  if (opts.type) {
    where = "b.type = ?";
    p.push(opts.type);
  }
  p.push(opts.limit ?? 50);
  return all(
    `SELECT b.*, st.title story_title FROM blindspots b JOIN stories st ON st.id = b.story_id
     WHERE ${where} ORDER BY st.score DESC, b.detected_at DESC LIMIT ?`,
    ...p,
  ).map(toBlindspot);
}

/** At most one current example per blindspot type; types with no example are omitted. */
export function currentBlindspotsByType(): Blindspot[] {
  const seen = new Set<string>();
  return listBlindspots({ limit: 200 }).filter((b) => !seen.has(b.type) && seen.add(b.type));
}

/* ---------- sources ---------- */

export function listSources(opts: { type?: SourceTypeId } = {}): (Source & { articleCount: number })[] {
  const rows = opts.type
    ? all(
        `SELECT s.*, (SELECT COUNT(*) FROM articles a WHERE a.source_id = s.id) n
         FROM sources s WHERE s.active = 1 AND s.type = ? ORDER BY s.name`,
        opts.type,
      )
    : all(
        `SELECT s.*, (SELECT COUNT(*) FROM articles a WHERE a.source_id = s.id) n
         FROM sources s WHERE s.active = 1 ORDER BY s.name`,
      );
  return rows.map((r) => ({ ...toSource(r), articleCount: r.n as number }));
}

export function getSource(id: string): SourceProfile | null {
  const r = one(`SELECT * FROM sources WHERE id = ?`, id);
  if (!r) return null;
  const src = toSource(r);
  const recentArticles = all(
    `${ARTICLE_SELECT} WHERE a.source_id = ? ORDER BY a.published_at DESC LIMIT 20`,
    id,
  ).map(toArticle);
  const counts = one(
    `SELECT COUNT(*) n, COUNT(DISTINCT story_id) st FROM articles WHERE source_id = ?`,
    id,
  )!;
  const regionRows = all(
    `SELECT region, COUNT(*) n FROM articles WHERE source_id = ? AND region IS NOT NULL GROUP BY region`,
    id,
  );
  const total = regionRows.reduce((a, x) => a + (x.n as number), 0) || 1;
  return {
    ...src,
    articleCount: counts.n as number,
    storyCount: counts.st as number,
    recentArticles,
    stories: listStories({ sourceId: id, limit: 12 }),
    coverage: regionRows
      .map((x) => ({
        regionId: x.region as RegionId,
        articles: x.n as number,
        share: (x.n as number) / total,
      }))
      .sort((a, b) => b.articles - a.articles),
  };
}

/* ---------- search ---------- */

/** Returns Stories (not articles) matching the query in title, summary, or any article headline. */
export function search(q: string, limit = 25): StorySummary[] {
  const term = `%${q.trim().toLowerCase()}%`;
  if (term === "%%") return [];
  const rows = all(
    `SELECT st.* FROM stories st
     WHERE lower(st.title) LIKE ? OR lower(st.summary) LIKE ? OR lower(st.topic) LIKE ?
        OR EXISTS (SELECT 1 FROM articles a WHERE a.story_id = st.id
                   AND (lower(a.headline) LIKE ? OR lower(a.excerpt) LIKE ?))
     ORDER BY st.updated_at DESC LIMIT ?`,
    term,
    term,
    term,
    term,
    term,
    limit,
  );
  return toSummaries(rows);
}

/* ---------- edition ---------- */

export function getTrendingTopics(sinceHours = 72) {
  const rows = all(
    `SELECT st.topic, COUNT(*) n FROM stories st WHERE st.updated_at >= ?
     GROUP BY st.topic ORDER BY n DESC LIMIT 12`,
    sinceIso(sinceHours),
  );
  const list = rows.length
    ? rows
    : all(`SELECT topic, COUNT(*) n FROM stories GROUP BY topic ORDER BY n DESC LIMIT 12`);
  return list.map((r) => ({ topic: r.topic as string, stories: r.n as number }));
}

export function getPlatformStats() {
  const since = sinceIso(24);
  return {
    articlesToday: (one(`SELECT COUNT(*) n FROM articles WHERE published_at >= ?`, since)!.n as number) ?? 0,
    sources: one(`SELECT COUNT(*) n FROM sources WHERE active = 1`)!.n as number,
    stories: one(`SELECT COUNT(*) n FROM stories WHERE updated_at >= ?`, since)!.n as number,
  };
}

export function getLastIngest() {
  const r = one(`SELECT * FROM ingest_runs WHERE finished_at IS NOT NULL ORDER BY id DESC LIMIT 1`);
  return r
    ? {
        finishedAt: r.finished_at as string,
        articlesSeen: r.articles_seen as number,
        articlesNew: r.articles_new as number,
        stories: r.stories as number,
      }
    : null;
}

/** Everything the front page needs. Only stories with 2+ sources are front-page eligible. */
export function getEdition(): Edition {
  let pool = listStories({ sinceHours: 72, limit: 60 });
  if (pool.length < 5) pool = listStories({ limit: 60 });
  const multi = pool.filter((s) => s.stats.sources >= 2);
  const ranked = multi.length >= 5 ? multi : pool;
  const lead = ranked[0] ? getStory(ranked[0].id) : null;
  return {
    date: new Date().toISOString(),
    briefing: ranked.slice(0, 5),
    lead,
    featured: ranked.slice(1, 4),
    topStories: ranked.slice(4, 16),
    blindspots: currentBlindspotsByType(),
    coverage: getRegionCoverage({ sinceHours: 48 }),
    trendingTopics: getTrendingTopics(),
    platformStats: getPlatformStats(),
  };
}

/** Stories touching a region, for My Area and region pages. */
export function getAreaFeed(regionId: RegionId) {
  const local = listStories({ region: regionId, limit: 20 });
  const govt = listStories({ region: regionId, sourceType: "government", limit: 10 });
  const community = listStories({ region: regionId, sourceType: "community", limit: 10 });
  const sources = listSources().filter((s) => s.regions.includes(regionId));
  return { local, govt, community, sources };
}
