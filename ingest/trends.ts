import { insertRows } from "./perf";
import type { Db } from "../db/client";
import { FEEDS } from "../config/feeds";
import { bigrams, entities, normalize, tokenize } from "./text";

const WEEK = 7 * 86400_000;
const GENERIC = new Set(["metro manila", "president", "vice president", "senate", "house", "manila", "world", "breaking", "latest"]);
const outlets = FEEDS.flatMap((f) => [normalize(f.name), normalize(f.name.replace(/\s*\([^)]*\)/g, "")), f.id.replace(/-/g, " ")]);
export interface TrendArticle { id: string; headline: string; source_id: string; story_id: string | null; published_at: string; }
export interface RankedTerm { term: string; slug: string; articles: number; sources: number; stories: number; prev_articles: number; score: number; sample_story_ids: string[]; }
export function candidateTerms(headline: string): Map<string, string> {
  const clean = headline.replace(/[’']s\b/g, "");
  const candidates = entities(`Headline ${clean}`);
  const pairs = new Set(bigrams(clean));
  for (const phrase of clean.match(/\b[A-Z][a-zñ]+(?:\s+[A-Z][a-zñ]+)+\b/g) ?? []) {
    const key = normalize(phrase);
    if (pairs.has(key) || key.split(" ").length > 2) candidates.add(key);
  }
  for (const phrase of clean.match(/\b[A-Z]{2,}(?:\s+[A-Z]{2,})+\b/g) ?? []) candidates.add(normalize(phrase));
  for (const acronym of clean.match(/\b[A-Z]{2,8}\b/g) ?? []) candidates.add(normalize(acronym));
  const out = new Map<string, string>();
  for (const key of candidates) {
    if (key === "headline" || GENERIC.has(key) || !tokenize(key).length || key.split(/\s+/).some((w) => !tokenize(w).length) || outlets.some((name) => name === key || name.includes(key) || key.includes(name))) continue;
    const original = clean.match(new RegExp(`\\b${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i"))?.[0] ?? key;
    out.set(key, /^[A-Z]{2,8}$/.test(original) ? original : original.replace(/\b\w/g, (c) => c.toUpperCase()));
  }
  return out;
}
export function rankTrendingTerms(rows: TrendArticle[], now = Date.now()): RankedTerm[] {
  const buckets = new Map<string, { term: string; current: Map<string, TrendArticle>; previous: Set<string> }>();
  for (const row of rows) {
    const age = now - Date.parse(row.published_at);
    if (age < 0 || age >= WEEK * 2) continue;
    for (const [key, term] of candidateTerms(row.headline)) {
      const bucket = buckets.get(key) ?? { term, current: new Map(), previous: new Set() };
      if (age < WEEK) bucket.current.set(row.id, row); else bucket.previous.add(row.id);
      buckets.set(key, bucket);
    }
  }
  return [...buckets].flatMap(([key, b]) => {
    const current = [...b.current.values()];
    const sources = new Set(current.map((r) => r.source_id)).size;
    const stories = [...new Set(current.flatMap((r) => r.story_id ? [r.story_id] : []))];
    if (sources < 3 || stories.length < 2) return [];
    return [{ term: b.term, slug: key.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), articles: current.length, sources, stories: stories.length, prev_articles: b.previous.size, score: sources * Math.log1p(current.length) * ((current.length + 1) / (b.previous.size + 1)), sample_story_ids: stories.slice(0, 20) }];
  }).sort((a, b) => b.score - a.score || a.slug.localeCompare(b.slug)).slice(0, 20);
}
export async function refreshTrendingTerms(db: Db, now = Date.now()) {
  const rows = await db.query<TrendArticle>(`SELECT a.id,a.headline,a.source_id,a.story_id,a.published_at FROM public_articles a JOIN sources s ON s.id=a.source_id WHERE s.type <> 'social' AND a.published_at >= $1`, [new Date(now - WEEK * 2).toISOString()]);
  const terms = rankTrendingTerms(rows, now);
  await db.tx(async (tx) => {
    await tx.execute("DELETE FROM trending_terms");
    await insertRows(tx, `INSERT INTO trending_terms(term,slug,window_start,articles,sources,stories,prev_articles,score,sample_story_ids,updated_at)`, terms.map((t) => [t.term,t.slug,new Date(now-WEEK).toISOString().slice(0,10),t.articles,t.sources,t.stories,t.prev_articles,t.score,JSON.stringify(t.sample_story_ids),new Date(now).toISOString()]));
  });
  console.log("Top trending terms:", terms.map((t) => `${t.term} (${t.sources} sources, ${t.stories} stories)`).join(" · ") || "none meeting coverage thresholds");
  return terms;
}
