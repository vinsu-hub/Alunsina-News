/**
 * Incremental story clustering (thresholds in lib/thresholds.ts → CLUSTERING).
 *
 * Every run re-reads the articles published inside the clustering window,
 * builds TF-IDF vectors (headline weighted 2×, excerpt 1×) plus a small boost
 * for shared named entities, and assigns each unclustered article to the most
 * similar existing cluster or starts a new one. Only clusters with articles
 * from at least `minSourcesForStory` distinct publishers become Stories;
 * single-source clusters stay as loose articles until another outlet reports.
 */
import { createHash } from "node:crypto";
import type { LlmRun } from "./llm";
import type { Db } from "../db/client";
import { CLUSTERING } from "../lib/thresholds";
import type { SourceTypeId, StoryStatus } from "../lib/taxonomy";
import { centroid, cosine, entities, idfFrom, jaccard, slugify, termFreq, tfidf, tokenize, type Vec } from "./text";

export interface WindowArticle {
  id: string;
  storyId: string | null;
  sourceId: string;
  sourceType: SourceTypeId;
  headline: string;
  excerpt: string;
  publishedAt: string;
  region: string | null;
  language: string;
  vec: Vec;
  ents: Set<string>;
}

interface Cluster {
  storyId: string | null;
  members: WindowArticle[];
  sum: Vec; // unnormalized sum of member vectors
  ents: Set<string>;
  u: Vec | null; // cached unit centroid, reset on join
  last: number;
}

const ENTITY_BOOST = 0.25;
const MERGE_SIMILARITY = 0.45;

export async function loadWindow(db: Db, now: number, hours: number = CLUSTERING.windowHours): Promise<WindowArticle[]> {
  const since = new Date(now - hours * 3600_000).toISOString();
  const rows = (await db.query(`SELECT a.id, a.story_id, a.source_id, s.type, a.headline, a.excerpt, a.published_at, a.region, a.language
       FROM articles a JOIN sources s ON s.id = a.source_id
       WHERE a.published_at >= $1 OR a.story_id IN (SELECT id FROM stories WHERE updated_at >= $2)`, [since, since])) as Record<string, string | null>[];
  const tfs = rows.map((r) => termFreq(tokenize(r.excerpt ?? ""), 1, termFreq(tokenize(r.headline!), 2)));
  const idf = idfFrom(tfs);
  return rows.map((r, i) => ({
    id: r.id!,
    storyId: r.story_id,
    sourceId: r.source_id!,
    sourceType: r.type as SourceTypeId,
    headline: r.headline!,
    excerpt: r.excerpt ?? "",
    publishedAt: r.published_at!,
    region: r.region,
    language: r.language!,
    vec: tfidf(tfs[i], idf),
    ents: entities(r.headline!),
  }));
}

const addTo = (sum: Vec, v: Vec) => {
  for (const [t, w] of v) sum.set(t, (sum.get(t) ?? 0) + w);
};
const unit = (sum: Vec) => centroid([sum]);

const unitOf = (c: Cluster) => (c.u ??= unit(c.sum));

function similarity(a: WindowArticle, c: Cluster): number {
  return cosine(a.vec, unitOf(c)) + ENTITY_BOOST * jaccard(a.ents, c.ents);
}

/* ---------- story metadata ---------- */

const TOPIC_WORDS: Record<string, string[]> = {
  Government: ["senate", "senator", "house", "congres", "lgu", "mayor", "governor", "palace", "president", "marcos", "cabinet", "budget", "election", "comelec", "bill", "law", "ordinance", "impeachment", "dilg"],
  Economy: ["inflation", "gdp", "peso", "economy", "economic", "bsp", "interest", "rate", "tariff", "export", "import", "remittance", "price", "jobs", "unemployment", "psa"],
  Business: ["company", "firm", "shares", "stock", "pse", "investor", "earnings", "profit", "bank", "merger", "startup", "retail", "revenue"],
  Education: ["deped", "school", "student", "teacher", "classes", "ched", "university", "tesda", "learner", "enrollment", "curriculum"],
  Health: ["doh", "health", "hospital", "dengue", "disease", "vaccine", "patient", "philhealth", "virus", "outbreak", "medical", "leptospirosis"],
  Environment: ["flood", "denr", "pollution", "reef", "forest", "mining", "wildlife", "garbage", "landslide", "environment", "river", "lake", "quarry"],
  Climate: ["climate", "typhoon", "storm", "pagasa", "rain", "monsoon", "habagat", "heat", "drought", "nino", "nina", "warming", "tropical", "depression", "signal"],
  Transport: ["mmda", "edsa", "traffic", "lrt", "mrt", "railway", "airport", "naia", "flight", "jeepney", "dotr", "ltfrb", "lto", "road", "bridge", "ferry", "marina"],
  Agriculture: ["rice", "palay", "farmer", "agriculture", "harvest", "fisher", "fishing", "crop", "livestock", "sugar", "coconut", "nfa", "pork", "asf", "bfar"],
  Technology: ["tech", "digital", "internet", "cyber", "online", "scam", "startup", "app", "telco", "smartphone", "dict", "artificial", "hacker", "data"],
  Justice: ["court", "doj", "charges", "case", "arrest", "police", "pnp", "nbi", "suspect", "ombudsman", "sandiganbayan", "graft", "killing", "murder", "drug", "trial", "sentenced", "jail"],
  Sports: ["asian games", "asiad", "olympic", "medal", "gold", "bronze", "pba", "uaap", "ncaa", "gilas", "fiba", "boxing", "volleyball", "basketball", "athlete", "tournament", "champion", "sea games"],
  "Foreign Affairs": ["china", "chinese", "dfa", "west philippine", "wps", "embassy", "ambassador", "asean", "japan", "united states", "maritime", "coast guard", "pcg", "diplomatic", "shoal", "spratly"],
};

export function pickTopic(texts: string[]): string {
  const blob = " " + texts.join(" ").toLowerCase() + " ";
  let best = "Government", bestScore = 0;
  for (const [topic, words] of Object.entries(TOPIC_WORDS)) {
    const score = words.reduce((a, w) => a + (blob.split(w).length - 1), 0);
    if (score > bestScore) [best, bestScore] = [topic, score];
  }
  return best;
}

const TITLE_TYPE_WEIGHT: Partial<Record<SourceTypeId, number>> = {
  national: 1, regional: 1, independent: 1, community: 0.95, state: 0.9, government: 0.85, primary: 0.8, social: 0.5,
};

/** Most central headline, preferring editorial sources and readable lengths. */
export function pickTitle(members: WindowArticle[]): string {
  if (members.length === 1) return members[0].headline;
  let best = members[0], bestScore = -1;
  for (const a of members) {
    const avg = members.reduce((s, b) => s + (a === b ? 0 : cosine(a.vec, b.vec)), 0) / (members.length - 1);
    const len = a.headline.length;
    const lenFactor = len < 35 ? 0.85 : len > 150 ? 0.85 : 1;
    const score = avg * (TITLE_TYPE_WEIGHT[a.sourceType] ?? 1) * lenFactor;
    if (score > bestScore) [best, bestScore] = [a, score];
  }
  return best.headline;
}

export function statusFor(first: number, last: number, recentCount: number, now: number): StoryStatus {
  const h = (t: number) => (now - t) / 3600_000;
  if (h(last) > 48) return "settled";
  if (h(first) < 12 || recentCount >= 2) return "developing";
  return "ongoing";
}

export function scoreFor(members: WindowArticle[], now: number): number {
  const sources = new Set(members.map((m) => m.sourceId)).size;
  const regions = new Set(members.map((m) => m.region).filter(Boolean)).size;
  const langs = new Set(members.map((m) => m.language)).size;
  const types = new Set(members.map((m) => m.sourceType)).size;
  const last = Math.max(...members.map((m) => Date.parse(m.publishedAt)));
  const decay = Math.exp(-((now - last) / 3600_000) / 18);
  return Math.round((sources * 3 + regions * 1.5 + langs * 2 + types * 1.5) * decay * 100) / 100;
}

const storyIdFor = (title: string, seed: string) =>
  `${slugify(title, 60)}-${createHash("sha1").update(seed).digest("hex").slice(0, 5)}`;

/* ---------- main ---------- */

export interface ClusterResult {
  touched: Set<string>;
  created: number;
  merged: number;
  windowArticles: WindowArticle[];
}

export async function cluster(db: Db, now = Date.now(), llm?: LlmRun): Promise<ClusterResult> {
  const window = await loadWindow(db, now);
  const existingTopics = new Map((await db.query<{ id: string; topic: string }>(`SELECT id,topic FROM stories`)).map((s) => [s.id, s.topic]));
  const clusters = new Map<string, Cluster>(); // key: storyId or temp id
  const newCluster = (key: string, storyId: string | null): Cluster => {
    const c: Cluster = { storyId, members: [], sum: new Map(), ents: new Set(), u: null, last: 0 };
    clusters.set(key, c);
    return c;
  };
  const join = (c: Cluster, a: WindowArticle) => {
    c.members.push(a);
    addTo(c.sum, a.vec);
    c.u = null;
    c.last = Math.max(c.last, Date.parse(a.publishedAt));
    for (const e of a.ents) c.ents.add(e);
  };

  for (const a of window) if (a.storyId) join(clusters.get(a.storyId) ?? newCluster(a.storyId, a.storyId), a);

  const loose = window.filter((a) => !a.storyId).sort((x, y) => x.publishedAt.localeCompare(y.publishedAt));
  let tmp = 0;
  const changed = new Set<Cluster>();
  for (const a of loose) {
    let best: Cluster | null = null, bestSim = 0;
    const t = Date.parse(a.publishedAt);
    for (const c of clusters.values()) {
      if (Math.abs(t - c.last) > CLUSTERING.windowHours * 3600_000) continue;
      const s = similarity(a, c);
      if (s > bestSim) [best, bestSim] = [c, s];
    }
    let sameEvent: boolean | null = null;
    if (best && Math.abs(cosine(a.vec, unitOf(best)) - CLUSTERING.similarity) <= 0.05)
      sameEvent = await llm?.sameEvent(a.headline, best.members.slice(0, 5).map((m) => m.headline).join("\n")) ?? null;
    const target = best && (sameEvent ?? bestSim >= CLUSTERING.similarity) ? best : newCluster(`tmp-${tmp++}`, null);
    join(target, a);
    changed.add(target);
  }

  // Merge near-duplicate clusters (two outlets' framing can seed separate clusters).
  let merged = 0;
  const list = [...clusters.values()].filter((c) => c.members.length).sort((a, b) => b.members.length - a.members.length);
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const big = list[i], small = list[j];
      if (!big.members.length || !small.members.length) continue;
      if (Math.abs(big.last - small.last) > CLUSTERING.windowHours * 3600_000) continue;
      const raw = cosine(unitOf(big), unitOf(small));
      const heuristic = raw + ENTITY_BOOST * jaccard(big.ents, small.ents) >= MERGE_SIMILARITY;
      const checked = Math.abs(raw - MERGE_SIMILARITY) <= 0.05
        ? await llm?.sameEvent(big.members.slice(0, 5).map((m) => m.headline).join("\n"), small.members.slice(0, 5).map((m) => m.headline).join("\n")) ?? null : null;
      if (!(checked ?? heuristic)) continue;
      for (const m of small.members) join(big, m);
      if (small.storyId && !big.storyId) big.storyId = small.storyId;
      else if (small.storyId) await db.execute(`DELETE FROM stories WHERE id = $1`, [small.storyId]); // articles re-pointed below
      small.members = [];
      changed.add(big);
      merged++;
    }
  }

  const touched = new Set<string>();
  let created = 0;
  const recentCutoff = now - 3 * 3600_000;

  for (const c of clusters.values()) {
    if (!c.members.length) continue;
    const sources = new Set(c.members.map((m) => m.sourceId));
    if (sources.size < CLUSTERING.minSourcesForStory && !c.storyId) continue;
    const times = c.members.map((m) => Date.parse(m.publishedAt));
    const first = Math.min(...times), last = Math.max(...times);
    const title = pickTitle(c.members);
    if (!c.storyId) {
      c.storyId = storyIdFor(title, c.members.map((m) => m.id).sort()[0]);
      created++;
    }
    const texts = c.members.map((m) => `${m.headline} ${m.excerpt}`);
    const topic = changed.has(c)
      ? (await llm?.topic(texts.join("\n"))) ?? pickTopic(texts)
      : existingTopics.get(c.storyId) ?? pickTopic(texts);
    const status = statusFor(first, last, times.filter((t) => t >= recentCutoff).length, now);
    await db.execute(`INSERT INTO stories (id,title,summary,status,topic,score,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT(id) DO UPDATE SET status=excluded.status, topic=excluded.topic, score=excluded.score, updated_at=excluded.updated_at`, [c.storyId, title, "", status, topic, scoreFor(c.members, now), new Date(first).toISOString(), new Date(last).toISOString()]);
    for (const m of c.members) if (m.storyId !== c.storyId) {
      await db.execute(`UPDATE articles SET story_id = $1 WHERE id = $2`, [c.storyId, m.id]);
      m.storyId = c.storyId;
    }
    if (changed.has(c) || c.members.some((m) => Date.parse(m.publishedAt) >= now - 6 * 3600_000)) touched.add(c.storyId);
  }
  return { touched, created, merged, windowArticles: window };
}
