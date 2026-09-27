/**
 * One ingestion run: upsert sources → fetch feeds → insert new articles and
 * fact-checks → cluster → derive per-story analysis → detect blindspots →
 * optional LLM pass → prune old data. Records an `ingest_runs` row.
 * The first live run removes the fictional sample edition.
 */
import { rescreenPending } from "../lib/prescreen";
import type { Db } from "../db/client";
import { FEEDS } from "../config/feeds";
import { detectBlindspots } from "./blindspots";
import { cluster } from "./cluster";
import { deriveStory, linkFactChecks } from "./derive";
import { fetchAll } from "./fetch";
import { archiveExternal, readExternal } from "./external";
import { fetchReddit } from "./social/reddit";
import { fetchX } from "./social/x";
import { attachSocial } from "./social/attach";
import { LlmRun, llmPass } from "./llm";
import { articleId, detectLanguage, tagRegion } from "./normalize";

import { linkRelatedStories, type RelatedResult } from "./related";

const RETAIN_DAYS = 14;

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
  for (const f of FEEDS) {
    // Public-listing collectors are active headline+link sources; unresolved feed sources stay inactive.
    const active = !f.factCheck && ((f.verified && f.feeds.length > 0) || f.collector === "agent-reach") ? 1 : 0;
    await db.execute(
      `INSERT INTO sources (id,name,type,ownership,ownership_source,data_status,paywalled,homepage,feed_url,regions,languages,topics,active)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     ON CONFLICT(id) DO UPDATE SET name=excluded.name, type=excluded.type, ownership=excluded.ownership,
       ownership_source=excluded.ownership_source, data_status=excluded.data_status, paywalled=excluded.paywalled,
       homepage=excluded.homepage, feed_url=excluded.feed_url, regions=excluded.regions, languages=excluded.languages,
       topics=excluded.topics, active=excluded.active`,
      [
        f.id,
        f.name,
        f.type,
        f.ownership,
        f.ownershipSource,
        f.collector === "agent-reach" && !f.feeds.length ? "link" : f.dataStatus,
        f.paywalled ? 1 : 0,
        f.homepage,
        f.feeds[0] ?? null,
        JSON.stringify(f.regions),
        JSON.stringify(f.languages),
        JSON.stringify(f.topics ?? []),
        active,
      ],
    );
  }
}

export async function runIngest(
  db: Db,
  opts: { dryRun?: boolean; now?: number; llm?: boolean } = {},
): Promise<IngestSummary> {
  const t0 = Date.now();
  const now = opts.now ?? Date.now();
  const dryRun = Boolean(opts.dryRun);
  const llm = new LlmRun(opts.llm !== false && !dryRun);
  const fetched = await fetchAll(now);
  const external = await readExternal(now);
  fetched.items.push(...external.items);
  const topicRows = await db.query<{ title: string }>(`SELECT title FROM stories WHERE updated_at >= $1 ORDER BY score DESC LIMIT 10`, [new Date(now - 48 * 3600_000).toISOString()]);
  const topics = [...topicRows.map((r) => r.title), ...fetched.items.slice(0, 10).map((r) => r.headline)];
  const [reddit, x] = await Promise.all([fetchReddit(topics, now), fetchX(topics, now)]);
  const socialItems = [...reddit.items, ...x.items];
  const socialSummary = { reddit: reddit.items.length, x: x.items.length, attached: 0, unmatched: 0, errors: [...reddit.errors, ...x.errors] };
  let externalAttached = 0;

  const rollback = new Error("dry-run rollback");
  let result: IngestSummary | undefined;
  let touched: string[] = [];
  try {
    result = await db.tx(async (db) => {
      const runId = (await db.one<{ id: number }>(
        `INSERT INTO ingest_runs (started_at) VALUES ($1) RETURNING id`,
        [new Date(t0).toISOString()],
      ))!.id;
      const removedSample = await removeSample(db);
      await upsertSources(db);

      let articlesNew = 0,
        factChecksNew = 0;
      const fetchedAt = new Date(now).toISOString();
      for (const it of fetched.items) {
        if (it.source.factCheck) {
          factChecksNew += Number(
            (
              await db.execute(
                `INSERT INTO fact_checks (story_id, claim, org, rating, url, published_at) VALUES (NULL,$1,$2,NULL,$3,$4) ON CONFLICT DO NOTHING`,
                [it.headline, it.source.name, it.url, it.publishedAt],
              )
            ).changes,
          );
          continue;
        }
        const text = `${it.headline}. ${it.excerpt}`;
        const lang = detectLanguage(text, it.source.languages);
        const region = tagRegion(it.headline, it.excerpt, it.source);
        const inserted = Number(
          (
            await db.execute(
              `INSERT INTO articles (id,source_id,story_id,headline,byline,url,excerpt,published_at,language,region,fetched_at,image_url,image_credit)
       VALUES ($1,$2,NULL,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT DO NOTHING`,
              [
                articleId(it.url),
                it.source.id,
                it.headline,
                it.byline,
                it.url,
                it.excerpt,
                it.publishedAt,
                lang,
                region,
                fetchedAt,
                it.imageUrl,
                it.imageCredit,
              ],
            )
          ).changes,
        );
        articlesNew += inserted;
        if (external.items.includes(it)) { externalAttached += inserted; }
      }

      const c = await cluster(db, now, llm);
      touched = [...c.touched];
      const linkedSocial = await attachSocial(db, socialItems, now);
      socialSummary.attached = linkedSocial.attached;
      socialSummary.unmatched = linkedSocial.unmatched;
      const socialStories = await db.query<{ story_id: string }>(`SELECT DISTINCT story_id FROM articles WHERE source_id IN ('social-reddit','social-x') AND published_at >= $1 AND story_id IS NOT NULL`, [new Date(now - 86400_000).toISOString()]);
      touched = [...new Set([...touched, ...socialStories.map((r) => r.story_id)])];
      await linkFactChecks(db, touched, now);
      let blindspots = 0;
      for (const id of touched) {
        await deriveStory(db, id);
        blindspots += await detectBlindspots(db, id, now);
      }

      const related = await linkRelatedStories(db, now);

      const cutoff = new Date(now - RETAIN_DAYS * 86400_000).toISOString();
      await db.execute(`DELETE FROM stories WHERE updated_at < $1`, [cutoff]);
      await db.execute(`DELETE FROM articles WHERE published_at < $1`, [
        cutoff,
      ]);
      await db.execute(`DELETE FROM fact_checks WHERE published_at < $1`, [
        new Date(now - 30 * 86400_000).toISOString(),
      ]);

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
      };
      if (dryRun) {
        summary.runId = null;
        result = summary;
        throw rollback;
      }
      return summary;
    });
  } catch (error) {
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
  if (!dryRun) { try { await rescreenPending(50, db); } catch (error) { console.error("Non-fatal pending screen failure", error); } }
  llm.logCounts();
  summary.durationMs = Date.now() - t0;
  return summary;
}
