/** Fixed-fixture comparison against a supplied pre-change ingest directory.
 * DATABASE_URL= NODE_OPTIONS=--conditions=react-server npx tsx ingest/perf-equivalence.ts [saved-baseline-directory]
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import type { Db, Params } from "../db/client";
import { applyMigrations } from "../db/migrate";
import * as currentCluster from "./cluster";
import * as currentDerive from "./derive";
import * as currentBlindspots from "./blindspots";
import * as currentRelated from "./related";
import * as currentTrends from "./trends";

async function main() {
  assert.equal(process.env.DATABASE_URL, "", "Explicitly select PGlite");
  const baseline = process.argv[2];
  const expectedHash = "7b3db55e0c627f2be96c265ca2380084787e6f960e0c5ef5b4302007f689a784";
  const load = (name: string) => import(pathToFileURL(path.resolve(baseline, `${name}.ts`)).href);
  const before = baseline ? await Promise.all(["cluster", "derive", "blindspots", "related", "trends"].map(load)) : null;
  const after = [currentCluster, currentDerive, currentBlindspots, currentRelated, currentTrends] as const;
  const now = Date.parse("2026-09-27T00:00:00Z");
  const results = [];
  for (const [label, modules] of (before ? [["before", before], ["after", after]] : [["after", after]]) as [string, typeof after][]) {
    const engine = new PGlite();
    const db: Db = {
      query: async <T>(sql: string, params: Params = []) => (await engine.query<Record<string, unknown>>(sql, [...params])).rows.map((row) => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, value instanceof Date ? value.toISOString() : value]))) as T[],
      one: async <T>(sql: string, params: Params = []) => (await db.query<T>(sql, params))[0],
      execute: async (sql, params = []) => ({ changes: (await engine.query(sql, [...params])).affectedRows ?? 0 }),
      exec: async (sql) => { await engine.exec(sql); },
      tx: async (fn) => fn(db), close: () => engine.close(),
    };
    await applyMigrations(db);
    for (let source = 0; source < 6; source++) await db.execute(`INSERT INTO sources(id,name,type,ownership,data_status,homepage) VALUES($1,$1,$2,'Fixture','feed','https://fixture.test')`, [`fixture-${source}`, ["national", "regional", "government", "primary", "independent", "community"][source]]);
    for (let event = 0; event < 12; event++) for (let source = 0; source < 6; source++) {
      const id = `${event}-${source}`;
      const at = new Date(now - event * 7 * 3600_000 - source * 60000).toISOString();
      const headline = ["Cebu port shipping cargo upgrade", "Davao flood warning river evacuation", "Laguna rice harvest irrigation farmers"][event % 3];
      await db.execute(`INSERT INTO articles(id,source_id,headline,excerpt,url,published_at,fetched_at,language,region) VALUES($1,$2,$3,$4,$5,$6,$6,'en','ncr')`, [id, `fixture-${source}`, headline, `${headline}. Residents and families affected by the policy await official department response and new documents.`, `https://fixture.test/${id}`, at]);
    }
    const started = performance.now();
    const [clustering, deriving, blindspots, related, trends] = modules;
    const c = await clustering.cluster(db, now);
    for (const id of c.touched) { await deriving.deriveStory(db, id); await blindspots.detectBlindspots(db, id, now); }
    // Recompute populated collections to exercise replacement, not just initial inserts.
    for (const id of c.touched) { await deriving.deriveStory(db, id); await blindspots.detectBlindspots(db, id, now); }
    await related.linkRelatedStories(db, now);
    await trends.refreshTrendingTerms(db, now);
    const ms = performance.now() - started;
    const tables = ["stories", "articles", "blindspots", "story_emphasis", "story_angles", "timeline_events", "evidence", "story_links", "trending_terms"];
    const data = [];
    for (const table of tables) {
      // Serial surrogate IDs are implementation details, not edition behavior.
      const rows = await db.query(`SELECT to_jsonb(t) - ${["blindspots", "timeline_events", "evidence"].includes(table) ? "'id'" : "'__unused'"} AS row FROM ${table} t`);
      data.push({ table, rows: rows.map((r) => JSON.stringify(r)).sort() });
    }
    const hash = createHash("sha256").update(JSON.stringify(data)).digest("hex");
    results.push(hash);
    console.log(JSON.stringify({ label, ms, hash, articles: 72, stories: c.touched.size }));
    await db.close();
  }
  assert.equal(results.at(-1), before ? results[0] : expectedHash);
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
