/**
 * One ingestion run: upsert sources → fetch feeds → insert new articles and
 * fact-checks → cluster → derive per-story analysis → detect blindspots →
 * optional LLM pass → prune old data. Records an `ingest_runs` row.
 * The first live run removes the fictional sample edition.
 */
import { runEditorialEdition } from "./placement";
import { insertRows, timedDb } from "./perf";
import { refreshTrendingTerms } from "./trends";
import { rescreenPending } from "../lib/prescreen";
import type { Db } from "../db/client";
import { FEEDS } from "../config/feeds";
import { detectBlindspots } from "./blindspots";
import { cluster } from "./cluster";
import { deriveStory, linkFactChecks, loadMembersMany } from "./derive";
import { fetchAll } from "./fetch";
import { archiveExternal, readExternal } from "./external";
import { fetchReddit } from "./social/reddit";
import { fetchX } from "./social/x";
import { attachSocial } from "./social/attach";
import { LlmRun, llmPass } from "./llm";
import { articleId, detectLanguage, tagRegion } from "./normalize";

import { linkRelatedStories, type RelatedResult } from "./related";

const RETAIN_DAYS = 14;
/** Transaction-scoped advisory lock key: only one ingest may write at a time (works with the Supabase transaction pooler). */
const INGEST_LOCK_KEY = 84_220_927;

/** Thrown inside the transaction when another ingest holds the lock; the run is skipped, not failed. */
class IngestBusy extends Error {}

export interface IngestSummary {
  runId: number | null;
  dryRun: boolean;
  feedsOk: number;
  feedErrors: { source: string; url: string; error: string }[];
  articlesSeen: number;
  articlesNew: number;
  articlesWithImages: number;
  external: { accepted: number; rejected: number; files: number; fileErrors: string[]; inserted: number };
  social: { reddit: number; x: number; attached: number; unmatched: number; errors: string[] };
  related: RelatedResult;
  llmCalls: { haiku: number; sonnet: number };
  factChecksNew: number;
  storiesTouched: number;
  storiesCreated: number;
  storiesMerged: number;
  blindspots: number;
  llm: { updated: number; errors: string[] };
  removedSample: boolean;
  durationMs: number;
  stages: Record<string, number>;
  /** Set when the run was skipped because another ingest was already writing. */
  skipped?: "another_ingest_running";
}

async function removeSample(db: Db): Promise<boolean> {
  const has = await db.one(
    `SELECT 1 FROM sources WHERE id LIKE 'sample-%' LIMIT 1`,
    [],
  );
  if (!has) return false;
  await db.exec(`DELETE FROM stories WHERE id IN (SELECT DISTINCT story_id FROM articles WHERE source_id LIKE 'sample-%' AND story_id IS NOT NULL);
           DELETE FROM contributors WHERE is_sample = true; DELETE FROM articles WHERE source_id LIKE 'sample-%';
           DELETE FROM sources WHERE id LIKE 'sample-%'; DELETE FROM contributors WHERE is_sample = true;`);
  return true;
}

async function upsertSources(db: Db) {
  const rows = FEEDS.map((f) => {
    // Public-listing collectors are active headline+link sources; unresolved feed sources stay inactive.
    const active = !f.factCheck && ((f.verified && f.feeds.length > 0) || f.collector === "agent-reach") ? 1 : 0;
    return [
        f.id, f.name, f.type, f.ownership, f.ownershipSource,
        f.collector === "agent-reach" && !f.feeds.length ? "link" : f.dataStatus,
        f.paywalled ? 1 : 0, f.homepage, f.feeds[0] ?? null,
        JSON.stringify(f.regions), JSON.stringify(f.languages), JSON.stringify(f.topics ?? []), active,
    ];
  });
  await insertRows(db,
      `INSERT INTO sources (id,name,type,ownership,ownership_source,data_status,paywalled,homepage,feed_url,regions,languages,topics,active)
`, rows, `ON CONFLICT(id) DO UPDATE SET name=excluded.name, type=excluded.type, ownership=excluded.ownership,
       ownership_source=excluded.ownership_source, data_status=excluded.data_status, paywalled=excluded.paywalled,
       homepage=excluded.homepage, feed_url=excluded.feed_url, regions=excluded.regions, languages=excluded.languages,
       topics=excluded.topics, active=excluded.active`);
}

export async function runIngest(
  db: Db,
  opts: { dryRun?: boolean; now?: number; llm?: boolean } = {},
): Promise<IngestSummary> {
  db = timedDb(db);
  const stages: Record<string, number> = Object.fromEntries(["fetch", "insert", "external", "social", "cluster", "derive", "blindspots", "related", "trends", "rescreen", "prune"].map((stage) => [stage, 0]));
  async function stage<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try { return await fn(); } finally { stages[name] += performance.now() - start; }
  }
  const t0 = Date.now();
  const now = opts.now ?? Date.now();
  const dryRun = Boolean(opts.dryRun);
  const llm = new LlmRun(opts.llm !== false && !dryRun);
  const fetched = await stage("fetch", () => fetchAll(now));
  const external = await stage("external", () => readExternal(now));
  fetched.items.push(...external.items);
  const topicRows = await db.query<{ title: string }>(`SELECT title FROM stories WHERE updated_at >= $1 ORDER BY score DESC LIMIT 10`, [new Date(now - 48 * 3600_000).toISOString()]);
  const topics = [...topicRows.map((r) => r.title), ...fetched.items.slice(0, 10).map((r) => r.headline)];
  const [reddit, x] = await stage("social", () => Promise.all([fetchReddit(topics, now), fetchX(topics, now)]));
  const socialItems = [...reddit.items, ...x.items];
  const socialSummary = { reddit: reddit.items.length, x: x.items.length, attached: 0, unmatched: 0, errors: [...reddit.errors, ...x.errors] };
  let externalAttached = 0;

  const rollback = new Error("dry-run rollback");
  let result: IngestSummary | undefined;
  let touched: string[] = [];
  try {
    result = await db.tx(async (db) => {
      const lock = await db.one<{ ok: boolean }>(`SELECT pg_try_advisory_xact_lock($1) AS ok`, [INGEST_LOCK_KEY]);
      if (!lock?.ok) throw new IngestBusy();
      const runId = (await db.one<{ id: number }>(
        `INSERT INTO ingest_runs (started_at) VALUES ($1) RETURNING id`,
        [new Date(t0).toISOString()],
      ))!.id;
      const removedSample = await removeSample(db);
      let articlesNew = 0, factChecksNew = 0;
      await stage("insert", async () => {
        await upsertSources(db);
        const fetchedAt = new Date(now).toISOString();
        const factChecks = fetched.items.filter((it) => it.source.factCheck);
        factChecksNew = await insertRows(db, `INSERT INTO fact_checks (story_id,claim,org,rating,url,published_at)`, factChecks.map((it) => [null, it.headline, it.source.name, null, it.url, it.publishedAt]), "ON CONFLICT DO NOTHING");
        // RETURNING preserves inserted counts even when input URLs repeat.
        for (let offset = 0; offset < fetched.items.length; offset += 500) {
          const items = fetched.items.slice(offset, offset + 500).filter((it) => !it.source.factCheck);
          if (!items.length) continue;
          const params: unknown[] = [];
          const values = items.map((it) => {
            const row = [articleId(it.url), it.source.id, null, it.headline, it.byline, it.url, it.excerpt, it.publishedAt, detectLanguage(`${it.headline}. ${it.excerpt}`, it.source.languages), tagRegion(it.headline, it.excerpt, it.source), fetchedAt, it.imageUrl, it.imageCredit];
            return `(${row.map((value) => { params.push(value); return `$${params.length}`; }).join(",")})`;
          });
          const inserted = await db.query<{ id: string }>(`INSERT INTO articles (id,source_id,story_id,headline,byline,url,excerpt,published_at,language,region,fetched_at,image_url,image_credit) VALUES ${values.join(",")} ON CONFLICT DO NOTHING RETURNING id`, params);
          articlesNew += inserted.length;
          const externalIds = new Set(items.filter((it) => external.items.includes(it)).map((it) => articleId(it.url)));
          externalAttached += inserted.filter((row) => externalIds.has(row.id)).length;
        }
      });

      const c = await stage("cluster", () => cluster(db, now, llm));
      touched = [...c.touched];
      const linkedSocial = await stage("social", () => attachSocial(db, socialItems, now));
      socialSummary.attached = linkedSocial.attached;
      socialSummary.unmatched = linkedSocial.unmatched;
      const socialStories = await db.query<{ story_id: string }>(`SELECT DISTINCT story_id FROM articles WHERE source_id IN ('social-reddit','social-x') AND published_at >= $1 AND story_id IS NOT NULL`, [new Date(now - 86400_000).toISOString()]);
      touched = [...new Set([...touched, ...socialStories.map((r) => r.story_id)])];
      const members = await stage("derive", () => loadMembersMany(db, touched));
      await stage("derive", () => linkFactChecks(db, touched, now, members));
      const contexts = await db.query<{ id: string; title: string; has_fact_check: boolean }>(`SELECT s.id,s.title, EXISTS(SELECT 1 FROM fact_checks f WHERE f.story_id=s.id) has_fact_check FROM stories s WHERE s.id=ANY($1::text[])`, [touched]);
      let blindspots = 0;
      for (const story of contexts) {
        const ms = members.get(story.id) ?? [];
        await stage("derive", () => deriveStory(db, story.id, ms));
        blindspots += await stage("blindspots", () => detectBlindspots(db, story.id, now, { members: ms, title: story.title, hasFactCheck: story.has_fact_check }));
      }
      const related = await stage("related", () => linkRelatedStories(db, now));
      await runEditorialEdition(db, now);

      await stage("prune", async () => {
      const cutoff = new Date(now - RETAIN_DAYS * 86400_000).toISOString();
      await db.execute(`DELETE FROM stories WHERE updated_at < $1`, [cutoff]);
      await db.execute(`DELETE FROM articles WHERE published_at < $1`, [
        cutoff,
      ]);
      await db.execute(`DELETE FROM fact_checks WHERE published_at < $1`, [
        new Date(now - 30 * 86400_000).toISOString(),
      ]);

      });
      const summary: IngestSummary = {
        runId,
        dryRun,
        feedsOk: fetched.feedsOk,
        feedErrors: fetched.errors,
        articlesSeen: fetched.items.length,
        articlesNew,
        articlesWithImages: fetched.items.filter((i) => !i.source.factCheck && i.imageUrl).length,
        external: { accepted: external.items.length, rejected: external.rejected, files: external.files.length, fileErrors: external.errors, inserted: externalAttached },
        social: socialSummary,
        related,
        llmCalls: llm.counts,
        factChecksNew,
        storiesTouched: touched.length,
        storiesCreated: c.created,
        storiesMerged: c.merged,
        blindspots,
        llm: { updated: 0, errors: llm.errors },
        removedSample,
        durationMs: 0,
        stages,
      };
      if (dryRun) {
        summary.runId = null;
        result = summary;
        throw rollback;
      }
      return summary;
    });
  } catch (error) {
    if (error instanceof IngestBusy) {
      console.warn("Another ingest is writing; skipping this run.");
      return {
        runId: null, dryRun, feedsOk: fetched.feedsOk, feedErrors: fetched.errors, articlesSeen: fetched.items.length,
        articlesNew: 0, articlesWithImages: 0,
        external: { accepted: 0, rejected: 0, files: 0, fileErrors: [], inserted: 0 }, // files stay in place for the next run
        social: socialSummary, related: { links: 0, examples: [] }, llmCalls: llm.counts,
        factChecksNew: 0, storiesTouched: 0, storiesCreated: 0, storiesMerged: 0, blindspots: 0,
        llm: { updated: 0, errors: [] }, removedSample: false, durationMs: Date.now() - t0, stages,
        skipped: "another_ingest_running",
      };
    }
    if (error !== rollback) throw error;
  }
  const summary = result!;
  if (!dryRun) {
    await archiveExternal(external, now);
    if (opts.llm !== false) summary.llm = await llmPass(db, touched, llm);
    await db.execute(
      `UPDATE ingest_runs SET finished_at=$1, articles_seen=$2, articles_new=$3, stories=$4, errors=$5 WHERE id=$6`,
      [
        new Date().toISOString(),
        summary.articlesSeen,
        summary.articlesNew,
        touched.length,
        JSON.stringify([
          ...fetched.errors,
          ...external.errors.map((error) => ({ source: "external", url: "", error })),
          ...socialSummary.errors.map((error) => ({ source: "social", url: "", error })),
          ...summary.llm.errors.map((error) => ({
            source: "llm",
            url: "",
            error,
          })),
        ]),
        summary.runId,
      ],
    );
  }
  if (!dryRun) { try { await stage("rescreen", () => rescreenPending(50, db)); } catch (error) { console.error("Non-fatal pending screen failure", error); } }
  if (!dryRun) await stage("trends", () => refreshTrendingTerms(db, now));
  llm.logCounts();
  summary.durationMs = Date.now() - t0;
  return summary;
}
