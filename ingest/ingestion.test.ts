/** Isolated integration checks: no live feeds, credentials, or dev database. */
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { extractItemImage, feedParser } from "./fetch";
import { linkRelatedStories } from "./related";

const message = (value: unknown) => Response.json({ id: "test", type: "message", role: "assistant", model: "test", stop_reason: "end_turn", stop_sequence: null, content: [{ type: "text", text: JSON.stringify(value) }], usage: { input_tokens: 1, output_tokens: 1 } });

test("publisher image fields, invalid protocols and null fallback", async () => {
  const feed = await feedParser.parseString(`<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/"><channel><title>Test</title><item><title>Media</title><media:content url="https://publisher.test/photo.jpg" medium="image" /></item><item><title>Thumbnail</title><media:thumbnail url="https://publisher.test/thumb.jpg" /></item><item><title>Enclosure</title><enclosure url="https://publisher.test/enclosure.jpg" type="image/jpeg" length="1" /></item></channel></rss>`);
  assert.deepEqual(feed.items.map(extractItemImage), ["https://publisher.test/photo.jpg", "https://publisher.test/thumb.jpg", "https://publisher.test/enclosure.jpg"]);
  assert.equal(extractItemImage({ content: '<img src="https://publisher.test/photo.jpg?a=1&amp;b=2">' }), "https://publisher.test/photo.jpg?a=1&b=2");
  assert.equal(extractItemImage({ content: '<img src="data:image/png;base64,test">' }), null);
  assert.equal(extractItemImage({ enclosure: { url: "https://publisher.test/video.mp4", type: "video/mp4" } }), null);
  assert.equal(extractItemImage({}), null);
});

test("SDK model split, caching, run budgets, off switch and failure fallback", async () => {
  const oldFetch = globalThis.fetch;
  const env = { ...process.env };
  let calls = 0;
  try {
    process.env.ANTHROPIC_API_KEY = "test-not-a-real-key";
    process.env.ANTHROPIC_BASE_URL = "http://127.0.0.1:1";
    process.env.ALUNSINA_LLM = "off";
    globalThis.fetch = async () => { calls++; throw new Error("must not call"); };
    const { LlmRun } = await import("./llm");
    const off = new LlmRun();
    assert.equal(await off.topic("school"), null);
    assert.equal(await off.sameEvent("a", "b"), null);
    assert.equal(await off.synthesis("a"), null);
    assert.equal(calls, 0);
    delete process.env.ALUNSINA_LLM;
    const models: string[] = [];
    globalThis.fetch = async (_input, init) => {
      calls++;
      const body = JSON.parse(String(init?.body));
      models.push(body.model);
      assert.equal(body.system[0].cache_control.type, "ephemeral");
      if (body.model === "claude-sonnet-5") return message({ summary: "A school opened. Teachers welcomed students.", emphasis: [] });
      return message({ topic: "Education", same_event: false });
    };
    const run = new LlmRun();
    assert.equal(await run.sameEvent("a", "b"), false);
    for (let i = 0; i < 45; i++) await run.topic("school");
    for (let i = 0; i < 20; i++) await run.synthesis("school");
    assert.deepEqual(run.counts, { haiku: 40, sonnet: 15 });
    assert.equal(calls, 55);
    assert.deepEqual(new Set(models), new Set(["claude-haiku-4-5", "claude-sonnet-5"]));
    globalThis.fetch = async () => Response.json({ error: { type: "overloaded_error", message: "test" } }, { status: 529 });
    const failed = new LlmRun();
    assert.equal(await failed.topic("school"), null);
    assert.equal(failed.counts.haiku, 1);
    assert.equal(failed.errors.length, 1);
    globalThis.fetch = async () => message({ topic: "Invented", same_event: "yes", summary: "One sentence.", emphasis: [] });
    const malformed = new LlmRun();
    assert.equal(await malformed.topic("school"), null);
    assert.equal(await malformed.sameEvent("a", "b"), null);
    assert.equal(await malformed.synthesis("a"), null);
  } finally {
    globalThis.fetch = oldFetch;
    for (const key of Object.keys(process.env)) if (!(key in env)) delete process.env[key];
    Object.assign(process.env, env);
  }
});

test("related directions, confidence gates, stale links and dry-run rollback", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "alunsina-ingestion-test-"));
  const env = { ...process.env };
  const oldFetch = globalThis.fetch;
  process.env.ALUNSINA_PGLITE_DIR = dir;
  delete process.env.DATABASE_URL;
  process.env.ALUNSINA_LLM = "off";
  // db/client may already be imported by LLM tests. Open the temporary
  // PGlite engine explicitly: getDb fixes DB_PATH at module evaluation.
  const { PGlite } = await import("@electric-sql/pglite");
  const { applyMigrations } = await import("../db/migrate");
  const { runIngest } = await import("./pipeline");
  const engine = new PGlite(dir);
  await engine.waitReady;
  const adapt = (client: import("@electric-sql/pglite").PGlite | import("@electric-sql/pglite").Transaction): import("../db/client").Db => {
    const db: import("../db/client").Db = {
      async query<T>(sql: string, params = []) { return (await client.query<T>(sql, [...params])).rows; },
      async one<T>(sql: string, params = []) { return (await db.query<T>(sql, params))[0]; },
      async execute(sql: string, params = []) { return { changes: (await client.query(sql, [...params])).affectedRows ?? 0 }; },
      async exec(sql: string) { await client.exec(sql); },
      async tx<T>(fn: (db: import("../db/client").Db) => Promise<T>) {
        if (!("transaction" in client)) throw new Error("no nested test transactions");
        return client.transaction((tx) => fn(adapt(tx)));
      },
      async close() { await engine.close(); },
    };
    return db;
  };
  const db = adapt(engine);
  await applyMigrations(db);
  try {
    await db.execute(`INSERT INTO sources (id,name,type,ownership,data_status,homepage) VALUES ('fixture','Fixture','community','Ownership not yet verified','feed','https://fixture.test')`);
    const now = Date.parse("2026-09-27T00:00:00Z");
    const pairs = [
      ["Cebu", "Transport", "Port upgrade in Cebu opens berths for freight shipping cargo", "Residents in Cebu protest road widening demolition resettlement port"],
      ["Davao", "Environment", "Flood warning in Davao prompts evacuation water river rainfall", "Council in Davao funds river cleanup plastics waste drainage"],
      ["Laguna", "Agriculture", "Rice harvest in Laguna raises crop yields irrigation farming", "Traders in Laguna seek rice import tariff review prices"],
    ];
    for (let i = 0; i < pairs.length; i++) {
      const [, topic, a, b] = pairs[i];
      for (let j = 0; j < 2; j++) {
        const id = `${i}-${j}`;
        const at = new Date(now - (4 - j) * 86400_000).toISOString();
        const headline = j ? b : a;
        await db.execute(`INSERT INTO stories (id,title,topic,created_at,updated_at) VALUES ($1,$2,$3,$4,$4)`, [id, headline, topic, at]);
        await db.execute(`INSERT INTO articles (id,source_id,story_id,headline,url,published_at,fetched_at) VALUES ($1,'fixture',$1,$2,$3,$4,$4)`, [id, headline, `https://fixture.test/${id}`, at]);
      }
    }
    const result = await linkRelatedStories(db, now);
    assert.equal(result.links, 6);
    assert.equal(result.examples.length, 3);
    console.log("Fixture related pairs:", JSON.stringify(result.examples));
    const links = await db.query<{ relation: string; confidence: number }>(`SELECT relation,confidence FROM story_links ORDER BY story_id,related_story_id`);
    assert.equal(links.filter((r) => r.relation === "earlier").length, 3);
    assert.equal(links.filter((r) => r.relation === "later").length, 3);
    assert.ok(links.every((r) => r.confidence >= 0.6 && r.confidence <= 1));
    await db.execute(`UPDATE stories SET topic='Health' WHERE id='0-1'`);
    assert.equal((await linkRelatedStories(db, now)).links, 4);
    await db.execute(`UPDATE stories SET created_at=$1 WHERE id='1-1'`, [new Date(now - 4 * 86400_000 + 3600_000).toISOString()]);
    assert.equal((await linkRelatedStories(db, now)).links, 2);
    const snapshot = async () => {
      const tables = ["sources", "articles", "stories", "story_links", "ingest_runs", "blindspots", "fact_checks", "story_emphasis", "story_angles", "timeline_events", "evidence"];
      return Promise.all(tables.map(async (table) => ({ table, rows: await db.query(`SELECT to_jsonb(t) row FROM ${table} t ORDER BY to_jsonb(t)::text`) })));
    };
    const before = await snapshot();
    globalThis.fetch = async () => new Response(`<rss version="2.0"><channel><title>Fixture</title><item><title>New unrelated article</title><link>https://fixture.test/new</link><pubDate>${new Date(now).toUTCString()}</pubDate></item></channel></rss>`);
    const dry = await runIngest(db, { dryRun: true, now });
    assert.equal(dry.runId, null);
    assert.deepEqual(dry.llmCalls, { haiku: 0, sonnet: 0 });
    assert.deepEqual(await snapshot(), before);
  } finally {
    await db.close();
    delete (globalThis as { __alunsinaDb?: unknown }).__alunsinaDb;
    globalThis.fetch = oldFetch;
    for (const key of Object.keys(process.env)) if (!(key in env)) delete process.env[key];
    Object.assign(process.env, env);
    await rm(dir, { recursive: true, force: true });
  }
});
