import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { readExternal, validateExternal } from "./external";
import { fetchReddit } from "./social/reddit";
import { fetchX } from "./social/x";
import { summarizeStoryStats } from "../lib/queries/story-stats";

const now = Date.parse("2026-09-27T12:00:00Z");
const sample = (changes: Record<string, unknown> = {}) => ({
  sourceId: "abs-cbn", headline: "A verified headline with enough text", url: "https://www.abs-cbn.com/news/example", publishedAt: "2026-09-27T10:00:00Z", excerpt: "First sentence. Second sentence. Third sentence.", collectedAt: "2026-09-27T11:00:00Z", collector: "agent-reach", ...changes,
});

test("external listing contract rejects bad JSON data and bounds excerpts", async () => {
  const valid = validateExternal(sample(), now);
  assert.ok(valid);
  assert.equal(valid.excerpt, "First sentence. Second sentence.");
  assert.equal(validateExternal(sample({ url: "https://evil.example/news" }), now), null);
  assert.equal(validateExternal(sample({ headline: "tiny" }), now), null);
  assert.equal(validateExternal(sample({ publishedAt: "2026-09-19T11:00:00Z" }), now), null);
  assert.equal(validateExternal(sample({ imageUrl: "javascript:alert(1)" }), now), null);
  assert.equal(validateExternal(sample({ sourceId: "inquirer" }), now), null);
  const dir = await mkdtemp(path.join(tmpdir(), "alunsina-external-"));
  try {
    await writeFile(path.join(dir, "batch.jsonl"), [JSON.stringify(sample()), "{bad json", JSON.stringify(sample({ url: "https://evil.example/" }))].join("\n"));
    const previous = process.env.EXTERNAL_ITEMS_DIR;
    process.env.EXTERNAL_ITEMS_DIR = dir;
    const batch = await readExternal(now);
    if (previous === undefined) delete process.env.EXTERNAL_ITEMS_DIR; else process.env.EXTERNAL_ITEMS_DIR = previous;
    assert.equal(batch.items.length, 1);
    assert.equal(batch.rejected, 2);
    assert.equal(batch.files.length, 1);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test("Reddit uses client credentials and stores only public post fields", async () => {
  let n = 0;
  const mock: typeof fetch = async (input, init) => {
    n++;
    if (n === 1) return Response.json({ access_token: "mock-token" });
    const u = new URL(String(input));
    assert.equal(new Headers(init?.headers).get("Authorization")?.startsWith("Bearer "), true);
    assert.ok(u.hostname === "oauth.reddit.com");
    return Response.json({ data: { children: [{ data: { title: "Relevant public discussion", permalink: "/r/Philippines/comments/abc/relevant/", subreddit: "Philippines", score: 42, created_utc: (now - 3600_000) / 1000, author: "must-not-leak", selftext: "must-not-leak" } }] } });
  };
  const result = await fetchReddit(["Relevant public discussion"], now, mock, { ...process.env, REDDIT_CLIENT_ID: "id", REDDIT_CLIENT_SECRET: "secret", REDDIT_USER_AGENT: "alunsina-news/1.0 by test" });
  assert.ok(result.items.length >= 1);
  assert.equal(result.items[0].metrics.score, 42);
  assert.equal("author" in result.items[0], false);
  assert.equal("selftext" in result.items[0], false);
});

test("X uses official v2 recent search and strips usernames", async () => {
  let called = false;
  const mock: typeof fetch = async (input, init) => {
    called = true;
    assert.equal(new URL(String(input)).hostname, "api.x.com");
    assert.match(new URL(String(input)).searchParams.get("query") ?? "", /lang:en OR lang:tl/);
    assert.equal(new Headers(init?.headers).get("Authorization"), "Bearer fake");
    return Response.json({ data: [{ id: "123456", text: "Official update from @private_user", created_at: "2026-09-27T11:00:00Z", public_metrics: { like_count: 12 } }] });
  };
  const result = await fetchX(["Official update"], now, mock, { ...process.env, X_BEARER_TOKEN: "fake" });
  assert.ok(called);
  assert.equal(result.items[0].title.includes("@private_user"), false);
  assert.equal(result.items[0].metrics.like_count, 12);
});

test("social items never increase reporting source statistics", () => {
  const rows = [
    { story_id: "s", source_id: "paper1", type: "national", region: "ncr", language: "en" },
    { story_id: "s", source_id: "reddit", type: "social", region: null, language: "en" },
    { story_id: "s", source_id: "x", type: "social", region: null, language: "fil" },
  ];
  assert.equal(summarizeStoryStats(rows, ["s"]).get("s")?.sources, 1);
});
