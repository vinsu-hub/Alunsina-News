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
  Contributor, ContributorProfile, Commentary, RelatedStory, MagnifiedNewsEntry, FlagInput, Flag, NewsletterSignup,
} from "./types";

type Row = Record<string, unknown>;
const db = getDb;
const all = async (sql: string, ...p: (string | number | null)[]) => (await (await db()).query(sql, [...p])) as Row[];
const one = async (sql: string, ...p: (string | number | null)[]) =>
  (await (await db()).one(sql, [...p])) as Row | undefined;

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
    imageUrl: (r.image_url as string) ?? null,
    imageCredit: (r.image_credit as string) ?? null,
    publishedAt: r.published_at as string,
    language: r.language as LanguageId,
    region: (r.region as RegionId) ?? null,
    source: toSource(r, "s_"),
  };
}

async function statsFor(storyIds: string[]): Promise<Map<string, StoryStats>> {
  const out = new Map<string, StoryStats>();
  if (!storyIds.length) return out;
  const ph = storyIds.map((_, i) => `$${i + 1}`).join(",");
  const rows = await all(
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

async function leadSources(storyIds: string[]): Promise<Map<string, Source>> {
  if (!storyIds.length) return new Map();
  const rows = await (await db()).query<Row>(`${ARTICLE_SELECT}
    WHERE a.id IN (SELECT DISTINCT ON (story_id) id FROM articles WHERE story_id = ANY($1::text[])
      ORDER BY story_id, published_at ASC, id)`, [storyIds]);
  return new Map(rows.map((r) => [r.story_id as string, toSource(r, "s_")]));
}

async function toSummaries(rows: Row[]): Promise<StorySummary[]> {
  const ids = rows.map((r) => r.id as string);
  const [stats, leads] = await Promise.all([statsFor(ids), leadSources(ids)]);
  const images = new Map<string, { url: string; credit: string }>();
  if (ids.length) {
    const rows = await (await db()).query<Row>(`SELECT DISTINCT ON (a.story_id) a.story_id, a.image_url, COALESCE(a.image_credit, s.name) credit
      FROM articles a JOIN sources s ON s.id = a.source_id
      WHERE a.story_id = ANY($1::text[]) AND a.image_url IS NOT NULL
      ORDER BY a.story_id, CASE WHEN s.type IN ('national','regional','independent') THEN 0 ELSE 1 END, a.published_at ASC, a.id`, [ids]);
    for (const image of rows) images.set(image.story_id as string, { url: image.image_url as string, credit: image.credit as string });
  }
  return rows.map((r) => ({
    id: r.id as string,
    title: r.title as string,
    summary: r.summary as string,
    status: r.status as StorySummary["status"],
    topic: r.topic as string,
    updatedAt: r.updated_at as string,
    stats: stats.get(r.id as string)!,
    leadSource: leads.get(r.id as string) ?? null,
    leadImage: images.get(r.id as string) ?? null,
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

export async function coverageFromRegionCounts(counts: Map<string, number>): Promise<IslandCoverage[]> {
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
export async function getRegionCoverage(opts: { storyId?: string; sinceHours?: number } = {}) {
  const rows = opts.storyId
    ? (await all(
        `SELECT region, COUNT(*)::int n FROM articles WHERE story_id = $1 AND region IS NOT NULL GROUP BY region`,
        opts.storyId,
      ))
    : (await all(
        `SELECT region, COUNT(*)::int n FROM articles WHERE region IS NOT NULL AND published_at >= $1 GROUP BY region`,
        sinceIso(opts.sinceHours ?? 48),
      ));
  return await coverageFromRegionCounts(new Map(rows.map((r) => [r.region as string, r.n as number])));
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

export async function listStories(f: StoryFilter = {}): Promise<StorySummary[]> {
  const where: string[] = ["1=1"];
  const p: (string | number)[] = [];
  const bind = (value: string | number) => { p.push(value); return `$${p.length}`; };
  if (f.topic) {
    where.push(`lower(st.topic) = lower(${bind(f.topic)})`);
  }
  if (f.sinceHours) {
    where.push(`st.updated_at >= ${bind(sinceIso(f.sinceHours))}`);
  }
  const articleConds: string[] = [];
  if (f.region) {
    articleConds.push(`a.region = ${bind(f.region)}`);
  }
  if (f.island) {
    const ids = REGIONS.filter((r) => r.island === f.island).map((r) => r.id);
    if (!ids.length) return [];
    articleConds.push(`a.region IN (${ids.map((id) => bind(id)).join(",")})`);
  }
  if (f.language) {
    articleConds.push(`a.language = ${bind(f.language)}`);
  }
  if (f.sourceType) {
    articleConds.push(`s.type = ${bind(f.sourceType)}`);
  }
  if (f.sourceId) {
    articleConds.push(`s.id = ${bind(f.sourceId)}`);
  }
  if (articleConds.length) {
    where.push(
      `EXISTS (SELECT 1 FROM articles a JOIN sources s ON s.id = a.source_id
               WHERE a.story_id = st.id AND ${articleConds.join(" AND ")})`,
    );
  }
  const limit = bind(f.limit ?? 30);
  const offset = bind(f.offset ?? 0);
  const rows = await all(
    `SELECT st.* FROM stories st WHERE ${where.join(" AND ")}
     ORDER BY st.score DESC, st.updated_at DESC LIMIT ${limit} OFFSET ${offset}`,
    ...p,
  );
  return await toSummaries(rows);
}

export async function getStory(id: string): Promise<StoryDetail | null> {
  const r = await one(`SELECT * FROM stories WHERE id = $1`, id);
  if (!r) return null;
  const [summary] = await toSummaries([r]);
  const articles = (await all(`${ARTICLE_SELECT} WHERE a.story_id = $1 ORDER BY a.published_at DESC`, id)).map(
    toArticle,
  );
  const emphasis: Emphasis[] = (await all(`SELECT * FROM story_emphasis WHERE story_id = $1`, id)).map((e) => ({
    sourceType: e.source_type as SourceTypeId,
    points: json(e.points, []),
  }));
  const angles: Angle[] = (await all(
    `SELECT * FROM story_angles WHERE story_id = $1 ORDER BY share DESC`,
    id,
  )).map((a) => ({ angle: a.angle as string, share: a.share as number, note: (a.note as string) ?? null }));
  const blindspots = (await all(
    `SELECT b.*, st.title story_title FROM blindspots b JOIN stories st ON st.id = b.story_id
     WHERE b.story_id = $1 ORDER BY b.detected_at DESC`,
    id,
  )).map(toBlindspot);
  const timeline: TimelineEvent[] = (await all(
    `SELECT * FROM timeline_events WHERE story_id = $1 ORDER BY at ASC`,
    id,
  )).map((t) => ({
    at: t.at as string,
    label: t.label as string,
    sourceType: (t.source_type as SourceTypeId) ?? null,
    articleId: (t.article_id as string) ?? null,
  }));
  const evidence: Evidence[] = (await all(
    `SELECT * FROM evidence WHERE story_id = $1 ORDER BY published_at DESC`,
    id,
  )).map((e) => ({
    kind: e.kind as Evidence["kind"],
    title: e.title as string,
    publisher: e.publisher as string,
    url: e.url as string,
    publishedAt: (e.published_at as string) ?? null,
  }));
  const factChecks = (await all(`SELECT * FROM fact_checks WHERE story_id = $1`, id)).map(toFactCheck);
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
    coverage: await getRegionCoverage({ storyId: id }),
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
export async function listBlindspots(opts: { type?: BlindspotTypeId; limit?: number } = {}): Promise<Blindspot[]> {
  const p: (string | number)[] = [];
  let where = "1=1";
  if (opts.type) {
    where = "b.type = $1";
    p.push(opts.type);
  }
  p.push(opts.limit ?? 50);
  return (await all(
    `SELECT b.*, st.title story_title FROM blindspots b JOIN stories st ON st.id = b.story_id
     WHERE ${where} ORDER BY st.score DESC, b.detected_at DESC LIMIT $${p.length}`,
    ...p,
  )).map(toBlindspot);
}

/** At most one current example per blindspot type; types with no example are omitted. */
export async function currentBlindspotsByType(): Promise<Blindspot[]> {
  const seen = new Set<string>();
  return (await listBlindspots({ limit: 200 })).filter((b) => !seen.has(b.type) && seen.add(b.type));
}

/* ---------- sources ---------- */

export async function listSources(opts: { type?: SourceTypeId } = {}): Promise<(Source & { articleCount: number })[]> {
  const rows = opts.type
    ? (await all(
        `SELECT s.*, (SELECT COUNT(*)::int FROM articles a WHERE a.source_id = s.id) n
         FROM sources s WHERE s.active = 1 AND s.type = $1 ORDER BY s.name`,
        opts.type,
      ))
    : (await all(
        `SELECT s.*, (SELECT COUNT(*)::int FROM articles a WHERE a.source_id = s.id) n
         FROM sources s WHERE s.active = 1 ORDER BY s.name`,
      ));
  return rows.map((r) => ({ ...toSource(r), articleCount: r.n as number }));
}

export async function getSource(id: string): Promise<SourceProfile | null> {
  const r = await one(`SELECT * FROM sources WHERE id = $1`, id);
  if (!r) return null;
  const src = toSource(r);
  const recentArticles = (await all(
    `${ARTICLE_SELECT} WHERE a.source_id = $1 ORDER BY a.published_at DESC LIMIT 20`,
    id,
  )).map(toArticle);
  const counts = (await one(
    `SELECT COUNT(*)::int n, COUNT(DISTINCT story_id)::int st FROM articles WHERE source_id = $1`,
    id,
  ))!;
  const regionRows = await all(
    `SELECT region, COUNT(*)::int n FROM articles WHERE source_id = $1 AND region IS NOT NULL GROUP BY region`,
    id,
  );
  const total = regionRows.reduce((a, x) => a + (x.n as number), 0) || 1;
  return {
    ...src,
    articleCount: counts.n as number,
    storyCount: counts.st as number,
    recentArticles,
    stories: await listStories({ sourceId: id, limit: 12 }),
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
export async function search(q: string, limit = 25): Promise<StorySummary[]> {
  const term = `%${q.trim().toLowerCase()}%`;
  if (term === "%%") return [];
  const rows = await all(
    `SELECT st.* FROM stories st
     WHERE lower(st.title) ILIKE $1 OR lower(st.summary) ILIKE $2 OR lower(st.topic) ILIKE $3
        OR EXISTS (SELECT 1 FROM articles a WHERE a.story_id = st.id
                   AND (lower(a.headline) ILIKE $4 OR lower(a.excerpt) ILIKE $5))
     ORDER BY st.updated_at DESC LIMIT $6`,
    term,
    term,
    term,
    term,
    term,
    limit,
  );
  return await toSummaries(rows);
}

/* ---------- edition ---------- */

export async function getTrendingTopics(sinceHours = 72) {
  const rows = await all(
    `SELECT st.topic, COUNT(*)::int n FROM stories st WHERE st.updated_at >= $1
     GROUP BY st.topic ORDER BY n DESC LIMIT 12`,
    sinceIso(sinceHours),
  );
  const list = rows.length
    ? rows
    : (await all(`SELECT topic, COUNT(*)::int n FROM stories GROUP BY topic ORDER BY n DESC LIMIT 12`));
  return list.map((r) => ({ topic: r.topic as string, stories: r.n as number }));
}

export async function getPlatformStats() {
  const since = sinceIso(24);
  return {
    articlesToday: ((await one(`SELECT COUNT(*)::int n FROM articles WHERE published_at >= $1`, since))!.n as number) ?? 0,
    sources: (await one(`SELECT COUNT(*)::int n FROM sources WHERE active = 1`))!.n as number,
    stories: (await one(`SELECT COUNT(*)::int n FROM stories WHERE updated_at >= $1`, since))!.n as number,
  };
}

export async function getLastIngest() {
  const r = await one(`SELECT * FROM ingest_runs WHERE finished_at IS NOT NULL ORDER BY id DESC LIMIT 1`);
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
export async function getEdition(): Promise<Edition> {
  let pool = await listStories({ sinceHours: 72, limit: 60 });
  if (pool.length < 5) pool = await listStories({ limit: 60 });
  const multi = pool.filter((s) => s.stats.sources >= 2);
  const ranked = multi.length >= 5 ? multi : pool;
  const lead = ranked[0] ? (await getStory(ranked[0].id)) : null;
  return {
    date: new Date().toISOString(),
    briefing: ranked.slice(0, 5),
    lead,
    featured: ranked.slice(1, 4),
    topStories: ranked.slice(4, 16),
    blindspots: await currentBlindspotsByType(),
    coverage: await getRegionCoverage({ sinceHours: 48 }),
    trendingTopics: await getTrendingTopics(),
    platformStats: await getPlatformStats(),
  };
}

/** Stories touching a region, for My Area and region pages. */
export async function getAreaFeed(regionId: RegionId) {
  const local = await listStories({ region: regionId, limit: 20 });
  const govt = await listStories({ region: regionId, sourceType: "government", limit: 10 });
  const community = await listStories({ region: regionId, sourceType: "community", limit: 10 });
  const sources = (await listSources()).filter((s) => s.regions.includes(regionId));
  return { local, govt, community, sources };
}

/* ---------- contributors, related stories, discovery, corrections ---------- */
function toContributor(r: Row): Contributor {
  return {
    id: r.id as string, name: r.name as string, kind: r.kind as Contributor["kind"],
    field: (r.field as Contributor["field"]) ?? null, credentials: r.credentials as string,
    affiliation: (r.affiliation as string) ?? null, conflicts: json(r.conflicts, []),
    bio: r.bio as string, portfolioUrl: (r.portfolio_url as string) ?? null,
    isSample: Boolean(r.is_sample), createdAt: r.created_at as string,
  };
}
export async function listContributors(opts: { kind?: Contributor["kind"]; field?: Contributor["field"] } = {}): Promise<Contributor[]> {
  return (await all(`SELECT * FROM contributors WHERE ($1::text IS NULL OR kind = $1) AND ($2::text IS NULL OR field = $2) ORDER BY name`, opts.kind ?? null, opts.field ?? null)).map(toContributor);
}
async function commentaryWhere(column: "story_id" | "contributor_id", id: string): Promise<Commentary[]> {
  const rows = await all(`SELECT * FROM commentary WHERE ${column} = $1 ORDER BY published_at DESC, id`, id);
  const contributors = new Map((await listContributors()).map((c) => [c.id, c]));
  return rows.map((r) => ({
    id: r.id as string, storyId: r.story_id as string, contributorId: r.contributor_id as string,
    title: r.title as string, body: r.body as string, publishedAt: r.published_at as string,
    isSample: Boolean(r.is_sample), label: "Analysis — Not Reporting", contributor: contributors.get(r.contributor_id as string)!,
  }));
}
export async function getContributor(id: string): Promise<ContributorProfile | null> {
  const row = await one(`SELECT * FROM contributors WHERE id = $1`, id);
  return row ? { ...toContributor(row), commentary: await commentaryWhere("contributor_id", id) } : null;
}
export async function getStoryCommentary(storyId: string): Promise<Commentary[]> { return commentaryWhere("story_id", storyId); }
export async function getRelatedStories(storyId: string): Promise<RelatedStory[]> {
  const rows = await all(`SELECT st.*, sl.relation, sl.confidence FROM story_links sl JOIN stories st ON st.id = sl.related_story_id
    WHERE sl.story_id = $1 AND sl.confidence >= 0.6 ORDER BY st.updated_at DESC, st.id`, storyId);
  const summaries = await toSummaries(rows);
  return summaries.map((story, i) => ({ ...story, relation: rows[i].relation as RelatedStory["relation"], confidence: rows[i].confidence as number }));
}
/** Earned discovery only: source diversity, freshness and regional reach; no paid or global engagement inputs. */
export async function getMagnifiedNews(island: "luzon" | "visayas" | "mindanao", limit = 5): Promise<MagnifiedNewsEntry[]> {
  const size = Math.max(0, Math.min(100, Math.floor(limit)));
  if (!size) return [];
  const regionIds = REGIONS.filter((r) => r.island === island).map((r) => r.id);
  const rows = await (await db()).query<Row>(`SELECT st.*,
    COUNT(DISTINCT a.source_id) FILTER (WHERE s.type IN ('independent','regional','community','journalist'))::int independent_sources,
    COUNT(DISTINCT a.region)::int localities,
    bool_or(a.region <> 'ncr') non_ncr,
    (SELECT sx.name FROM articles ax JOIN sources sx ON sx.id = ax.source_id
     WHERE ax.story_id = st.id AND ax.region = ANY($1::text[]) AND sx.type <> 'social'
     ORDER BY CASE WHEN sx.type IN ('independent','regional','community','journalist') THEN 0 ELSE 1 END, ax.published_at ASC, ax.id LIMIT 1) byline
    FROM stories st JOIN articles a ON a.story_id = st.id JOIN sources s ON s.id = a.source_id
    WHERE a.region = ANY($1::text[]) AND st.updated_at >= now() - interval '72 hours' AND s.type <> 'social'
    GROUP BY st.id HAVING COUNT(DISTINCT a.source_id) FILTER (WHERE s.type IN ('independent','regional','community','journalist')) > 0
    ORDER BY (COUNT(DISTINCT a.source_id) FILTER (WHERE s.type IN ('independent','regional','community','journalist')) * 3
      + COUNT(DISTINCT a.region) + GREATEST(0, 1 - EXTRACT(EPOCH FROM (now() - st.updated_at)) / 259200)) DESC,
      st.updated_at DESC, st.id`, [regionIds]);
  // Reserve two of a five-slot Luzon list when qualifying non-NCR reporting exists.
  const reserved = island === "luzon" ? rows.filter((r) => r.non_ncr).slice(0, Math.min(2, size)) : [];
  const selected = new Set(reserved.map((r) => r.id));
  for (const row of rows) { if (selected.size >= size) break; selected.add(row.id); }
  const picked = rows.filter((r) => selected.has(r.id));
  return (await toSummaries(picked)).map((story, i) => ({ ...story,
    byline: picked[i].byline as string,
    coverageChip: { sources: story.stats.sources, regions: picked[i].localities as number },
  }));
}
export async function createFlag(input: FlagInput): Promise<Flag> {
  if (!["coverage_mismatch", "related_mismatch", "source_miscategorized"].includes(input.kind) || !input.targetId.trim() || input.note.length > 500) throw new Error("Invalid flag");
  const row = await one(`INSERT INTO flags(kind,story_id,target_id,note) VALUES ($1,$2,$3,$4) RETURNING *`, input.kind, input.storyId ?? null, input.targetId.trim(), input.note);
  return { ...input, storyId: (row!.story_id as string) ?? null, targetId: row!.target_id as string, id: row!.id as number, createdAt: row!.created_at as string, status: row!.status as string };
}
export async function addNewsletterSignup(email: string): Promise<NewsletterSignup> {
  const normalized = email.trim().toLowerCase();
  if (normalized.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new Error("Invalid email address");
  const row = await one(`INSERT INTO newsletter_signups(email) VALUES ($1) ON CONFLICT(email) DO UPDATE SET email=excluded.email RETURNING *`, normalized);
  return { email: row!.email as string, createdAt: row!.created_at as string, confirmed: Boolean(row!.confirmed) };
}
