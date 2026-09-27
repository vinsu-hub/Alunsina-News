import { insertRows } from "./perf";
import type { Db } from "../db/client";
import { FEEDS } from "../config/feeds";
import { bigrams, entities, normalize, tokenize } from "./text";

const WEEK = 7 * 86400_000;
const GENERIC = new Set(["metro manila", "president", "vice president", "palace", "senate", "house", "court", "government", "police", "manila", "world", "breaking", "latest"]);
const DATES = new Set("jan january feb february mar march apr april may jun june jul july aug august sep sept september oct october nov november dec december mon monday tue tues tuesday wed wednesday thu thur thurs thursday fri friday sat saturday sun sunday today yesterday tomorrow".split(" "));
const INSTITUTIONS = new Set("dpwh pnp deped comelec bske nfa doh pagasa mmda".split(" "));
// Conservative personal-name aliases: do not merge geographic prefixes like South.
const FIRST_NAMES = new Set("sara rodrigo ferdinand mary juan maria leni risa bong imee grace francis martin gloria jose joseph".split(" "));
const containsTerm = (phrase: string, term: string) => ` ${phrase} `.includes(` ${term} `);
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
  for (const phrase of [...candidates]) {
    for (const word of phrase.split(/\s+/)) candidates.add(word);
  }
  const out = new Map<string, string>();
  for (const candidate of candidates) {
    const key = normalize(candidate).replace(/[^a-z0-9]+/g, " ").trim();
    if (key === "headline" || GENERIC.has(key) || key.split(/\s+/).some((w) => DATES.has(w) || (!tokenize(w).length && !INSTITUTIONS.has(w))) || outlets.some((name) => name === key || name.includes(key) || (!GENERIC.has(name) && key.includes(name)))) continue;
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
  // Resolve aliases against the entire two-week window, before coverage thresholds.
  for (const [key, alias] of buckets) {
    if (!FIRST_NAMES.has(key)) continue;
    const names = [...buckets.keys()].filter((name) => name.startsWith(`${key} `));
    const longest = names.filter((name) => !names.some((other) => other !== name && containsTerm(other, name)));
    if (longest.length !== 1) continue;
    const full = buckets.get(longest[0])!;
    for (const [id, article] of alias.current) full.current.set(id, article);
    for (const id of alias.previous) full.previous.add(id);
    buckets.delete(key);
  }
  const ranked = [...buckets].flatMap(([key, b]) => {
    const current = [...b.current.values()];
    const sources = new Set(current.map((r) => r.source_id)).size;
    const stories = [...new Set(current.flatMap((r) => r.story_id ? [r.story_id] : []))];
    if (sources < 3 || stories.length < 2) return [];
    return [{ key, ids: new Set(b.current.keys()), storyIds: new Set(stories), value: { term: b.term, slug: key.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), articles: current.length, sources, stories: stories.length, prev_articles: b.previous.size, score: sources * Math.log1p(current.length) * ((current.length + 1) / (b.previous.size + 1)), sample_story_ids: stories.slice(0, 20) } }];
  });
  const distinct = ranked.filter((short) => !ranked.some((long) => long.key !== short.key && containsTerm(long.key, short.key) && [...short.ids].filter((id) => long.ids.has(id)).length / short.ids.size >= 0.6));
  distinct.sort((a, b) => b.value.score - a.value.score || b.key.split(" ").length - a.key.split(" ").length || a.key.localeCompare(b.key));
  // Overlap uses complete story sets, rather than the capped sample persisted below.
  const overlaps = (a: typeof ranked[number], b: typeof ranked[number]) => [...a.storyIds].filter((id) => b.storyIds.has(id)).length / Math.min(a.storyIds.size, b.storyIds.size) > 0.7;
  const selected: typeof ranked = [];
  for (const candidate of distinct) {
    const similar = selected.filter((term) => overlaps(candidate, term));
    if (similar.length >= 2 || similar.some((term) => selected.some((other) => other !== term && overlaps(term, other)))) continue;
    selected.push(candidate);
    if (selected.length === 10) break;
  }
  return selected.map(({ value }) => value);
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
