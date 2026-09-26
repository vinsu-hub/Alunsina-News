/**
 * One ingestion run: upsert sources → fetch feeds → insert new articles and
 * fact-checks → cluster → derive per-story analysis → detect blindspots →
 * optional LLM pass → prune old data. Records an `ingest_runs` row.
 * The first live run removes the fictional sample edition.
 */
import type { DatabaseSync } from "node:sqlite";
import { FEEDS } from "../config/feeds";
import { detectBlindspots } from "./blindspots";
import { cluster } from "./cluster";
import { deriveStory, linkFactChecks } from "./derive";
import { fetchAll } from "./fetch";
import { llmPass } from "./llm";
import { articleId, detectLanguage, tagRegion } from "./normalize";

const RETAIN_DAYS = 14;

export interface IngestSummary {
  runId: number | null;
  dryRun: boolean;
  feedsOk: number;
  feedErrors: { source: string; url: string; error: string }[];
  articlesSeen: number;
  articlesNew: number;
  factChecksNew: number;
  storiesTouched: number;
  storiesCreated: number;
  storiesMerged: number;
  blindspots: number;
  llm: { updated: number; errors: string[] };
  removedSample: boolean;
  durationMs: number;
}

function removeSample(db: DatabaseSync): boolean {
  const has = db.prepare(`SELECT 1 FROM sources WHERE id LIKE 'sample-%' LIMIT 1`).get();
  if (!has) return false;
  db.exec(`DELETE FROM stories WHERE id IN (SELECT DISTINCT story_id FROM articles WHERE source_id LIKE 'sample-%' AND story_id IS NOT NULL);
           DELETE FROM articles WHERE source_id LIKE 'sample-%';
           DELETE FROM sources WHERE id LIKE 'sample-%';`);
  return true;
}

function upsertSources(db: DatabaseSync) {
  const up = db.prepare(
    `INSERT INTO sources (id,name,type,ownership,ownership_source,data_status,paywalled,homepage,feed_url,regions,languages,topics,active)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
     ON CONFLICT(id) DO UPDATE SET name=excluded.name, type=excluded.type, ownership=excluded.ownership,
       ownership_source=excluded.ownership_source, data_status=excluded.data_status, paywalled=excluded.paywalled,
       homepage=excluded.homepage, feed_url=excluded.feed_url, regions=excluded.regions, languages=excluded.languages,
       topics=excluded.topics, active=excluded.active`,
  );
  for (const f of FEEDS) {
    // Sources without a working feed stay out of the index until a feed or partnership exists.
    const active = f.verified && f.feeds.length > 0 && !f.factCheck ? 1 : 0;
    up.run(f.id, f.name, f.type, f.ownership, f.ownershipSource, f.dataStatus, f.paywalled ? 1 : 0, f.homepage,
      f.feeds[0] ?? null, JSON.stringify(f.regions), JSON.stringify(f.languages), JSON.stringify(f.topics ?? []), active);
  }
}

export async function runIngest(db: DatabaseSync, opts: { dryRun?: boolean; now?: number; llm?: boolean } = {}): Promise<IngestSummary> {
  const t0 = Date.now();
  const now = opts.now ?? Date.now();
  const dryRun = Boolean(opts.dryRun);
  const fetched = await fetchAll(now);

  db.exec("BEGIN");
  let runId: number | null = null;
  try {
    runId = Number(db.prepare(`INSERT INTO ingest_runs (started_at) VALUES (?)`).run(new Date(t0).toISOString()).lastInsertRowid);
    const removedSample = removeSample(db);
    upsertSources(db);

    const insA = db.prepare(
      `INSERT OR IGNORE INTO articles (id,source_id,story_id,headline,byline,url,excerpt,published_at,language,region,fetched_at)
       VALUES (?,?,NULL,?,?,?,?,?,?,?,?)`,
    );
    const insF = db.prepare(`INSERT OR IGNORE INTO fact_checks (story_id, claim, org, rating, url, published_at) VALUES (NULL,?,?,NULL,?,?)`);
    let articlesNew = 0, factChecksNew = 0;
    const fetchedAt = new Date(now).toISOString();
    for (const it of fetched.items) {
      if (it.source.factCheck) {
        factChecksNew += Number(insF.run(it.headline, it.source.name, it.url, it.publishedAt).changes);
        continue;
      }
      const text = `${it.headline}. ${it.excerpt}`;
      const lang = detectLanguage(text, it.source.languages);
      const region = tagRegion(it.headline, it.excerpt, it.source);
      articlesNew += Number(
        insA.run(articleId(it.url), it.source.id, it.headline, it.byline, it.url, it.excerpt, it.publishedAt, lang, region, fetchedAt).changes,
      );
    }

    const c = cluster(db, now);
    const touched = [...c.touched];
    linkFactChecks(db, touched, now);
    let blindspots = 0;
    for (const id of touched) {
      deriveStory(db, id);
      blindspots += detectBlindspots(db, id, now);
    }

    const cutoff = new Date(now - RETAIN_DAYS * 86400_000).toISOString();
    db.prepare(`DELETE FROM stories WHERE updated_at < ?`).run(cutoff);
    db.prepare(`DELETE FROM articles WHERE published_at < ?`).run(cutoff);
    db.prepare(`DELETE FROM fact_checks WHERE published_at < ?`).run(new Date(now - 30 * 86400_000).toISOString());

    const summary: IngestSummary = {
      runId, dryRun, feedsOk: fetched.feedsOk, feedErrors: fetched.errors, articlesSeen: fetched.items.length,
      articlesNew, factChecksNew, storiesTouched: touched.length, storiesCreated: c.created, storiesMerged: c.merged,
      blindspots, llm: { updated: 0, errors: [] }, removedSample, durationMs: 0,
    };
    if (dryRun) {
      db.exec("ROLLBACK");
      summary.runId = null;
      summary.durationMs = Date.now() - t0;
      return summary;
    }
    db.exec("COMMIT");

    if (opts.llm !== false) summary.llm = await llmPass(db, touched);
    summary.durationMs = Date.now() - t0;
    db.prepare(
      `UPDATE ingest_runs SET finished_at=?, articles_seen=?, articles_new=?, stories=?, errors=? WHERE id=?`,
    ).run(new Date().toISOString(), summary.articlesSeen, articlesNew, touched.length,
      JSON.stringify([...fetched.errors, ...summary.llm.errors.map((e) => ({ source: "llm", url: "", error: e }))]), runId);
    return summary;
  } catch (e) {
    try { db.exec("ROLLBACK"); } catch { /* already committed */ }
    throw e;
  }
}
