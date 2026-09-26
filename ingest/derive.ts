/**
 * Recomputes per-story analysis for stories touched this run:
 *  - summary: extractive, the 1–2 excerpt sentences closest to the story centroid
 *  - story_emphasis: distinctive phrases per source type (what each group stresses)
 *  - story_angles: share of articles per coverage angle (keyword lexicon)
 *  - timeline_events: first report per source type + source-count milestones
 *  - evidence: primary documents and official statements in the cluster
 *  - fact_checks: links fact-check items to the most similar story
 */
import { json, type Db } from "../db/client";
import { SOURCE_TYPE_IDS, type SourceTypeId } from "../lib/taxonomy";
import { bigrams, centroid, cosine, entities, idfFrom, splitSentences, stripLead, termFreq, tfidf, tokenize, type Vec } from "./text";

export interface MemberRow {
  id: string;
  sourceId: string;
  sourceName: string;
  sourceType: SourceTypeId;
  sourceRegions: string[];
  headline: string;
  excerpt: string;
  url: string;
  publishedAt: string;
  region: string | null;
  language: string;
}

export async function loadMembers(db: Db, storyId: string): Promise<MemberRow[]> {
  return (
    (await db.query(`SELECT a.id, a.source_id, s.name, s.type, s.regions, a.headline, a.excerpt, a.url, a.published_at, a.region, a.language
         FROM articles a JOIN sources s ON s.id = a.source_id WHERE a.story_id = $1 ORDER BY a.published_at ASC`, [storyId])) as Record<string, string | null>[]
  ).map((r) => ({
    id: r.id!,
    sourceId: r.source_id!,
    sourceName: r.name!,
    sourceType: r.type as SourceTypeId,
    sourceRegions: json(r.regions, []),
    headline: r.headline!,
    excerpt: r.excerpt ?? "",
    url: r.url!,
    publishedAt: r.published_at!,
    region: r.region,
    language: r.language!,
  }));
}

const vecs = (ms: MemberRow[]) => {
  const tfs = ms.map((m) => termFreq(tokenize(m.excerpt), 1, termFreq(tokenize(m.headline), 2)));
  const idf = idfFrom(tfs);
  return { vs: tfs.map((t) => tfidf(t, idf)), idf };
};

/* ---------- summary ---------- */

const SUMMARY_TYPE_PREF: SourceTypeId[] = ["national", "regional", "independent", "journalist", "community", "state", "government", "primary"];

export function extractiveSummary(ms: MemberRow[]): string {
  const { vs, idf } = vecs(ms);
  const c = centroid(vs);
  const cands: { s: string; v: Vec; score: number }[] = [];
  for (const m of ms) {
    if (m.sourceType === "social") continue;
    const pref = 1 - SUMMARY_TYPE_PREF.indexOf(m.sourceType) * 0.03;
    for (const s of splitSentences(stripLead(m.excerpt))) {
      const t = s.trim();
      if (t.length < 50 || t.length > 260 || /^(photo|file photo|watch|listen)/i.test(t)) continue;
      const v = tfidf(termFreq(tokenize(t)), idf);
      cands.push({ s: t, v, score: cosine(v, c) * pref });
    }
  }
  cands.sort((a, b) => b.score - a.score);
  if (!cands.length) return "";
  const first = cands[0];
  const second = cands.find((x) => x !== first && cosine(x.v, first.v) < 0.5 && first.s.length + x.s.length < 340);
  return second ? `${first.s} ${second.s}` : first.s;
}

/* ---------- emphasis ---------- */

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * 2–3 descriptive bullets per source type: the type's dominant coverage angle,
 * then its most distinctive topical phrases (log-odds vs the rest of the story).
 * Names of people and places are excluded — emphasis describes focus, not actors.
 */
export function emphasisByType(ms: MemberRow[]): Map<SourceTypeId, string[]> {
  const names = new Set<string>();
  for (const m of ms) for (const e of [...entities(m.headline), ...entities(m.excerpt)]) for (const w of e.split(" ")) names.add(w);
  const isName = (term: string) => term.split(" ").some((w) => names.has(w));
  const all = new Map<string, number>();
  const byType = new Map<SourceTypeId, Map<string, number>>();
  for (const m of ms) {
    const text = `${m.headline}. ${stripLead(m.excerpt)}`;
    const terms = [...bigrams(text), ...tokenize(text).filter((t) => t.length >= 5)].filter((t) => !isName(t));
    const t = byType.get(m.sourceType) ?? new Map<string, number>();
    for (const term of new Set(terms)) {
      t.set(term, (t.get(term) ?? 0) + 1);
      all.set(term, (all.get(term) ?? 0) + 1);
    }
    byType.set(m.sourceType, t);
  }
  const n = ms.length;
  const out = new Map<SourceTypeId, string[]>();
  for (const [type, counts] of byType) {
    const own = ms.filter((m) => m.sourceType === type);
    const nt = own.length;
    const picked: string[] = [];
    const angle = anglesFor(own)[0];
    if (angle && angle.angle !== "General reporting") picked.push(angle.angle);
    const scored = [...counts]
      .filter(([, c]) => nt < 2 || c >= 2) // with 2+ articles, a phrase must recur
      .map(([term, c]) => {
        const rest = (all.get(term) ?? 0) - c;
        const lift = Math.log((c + 0.5) / (nt + 1)) - Math.log((rest + 0.5) / (n - nt + 1));
        return { term, score: lift * (term.includes(" ") ? 1.4 : 1) * Math.sqrt(c) };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score);
    for (const { term } of scored) {
      if (picked.length >= 3) break;
      const words = term.split(" ");
      if (picked.some((p) => p.toLowerCase().split(/\W+/).some((w) => words.includes(w)))) continue;
      picked.push(cap(term));
    }
    if (picked.length) out.set(type, picked);
  }
  return out;
}

/* ---------- angles ---------- */

export const ANGLES: Record<string, string[]> = {
  "Official response & policy": ["announce", "order", "directive", "memorandum", "policy", "ordinance", "agency", "department", "palace", "president", "mayor", "governor", "lgu", "orders", "implement", "program"],
  "Public impact": ["residents", "families", "commuters", "students", "farmers", "fishers", "workers", "consumers", "evacuat", "stranded", "victims", "affected", "households", "community"],
  "Accountability & investigation": ["probe", "investigat", "charges", "graft", "corruption", "audit", "anomal", "complaint", "court", "ombudsman", "sandiganbayan", "hearing", "accountab"],
  "Economy & markets": ["economy", "market", "peso", "inflation", "stocks", "investment", "trade", "revenue", "gdp", "prices", "tariff", "cost", "billion", "million"],
  "Security & diplomacy": ["china", "coast guard", "navy", "military", "afp", "sea", "protest", "embassy", "dfa", "maritime", "police", "pnp", "security", "vessel"],
  "Weather & environment": ["climate", "weather", "rain", "flood", "typhoon", "storm", "pagasa", "heat", "drought", "environment", "landslide", "monsoon", "habagat"],
  "Health & safety": ["health", "doh", "hospital", "dengue", "disease", "virus", "patients", "vaccine", "injur", "dead", "casualt"],
};

export function anglesFor(ms: MemberRow[]): { angle: string; share: number }[] {
  const counts = new Map<string, number>();
  for (const m of ms) {
    const text = `${m.headline} ${m.excerpt}`.toLowerCase();
    let best = "General reporting", bestHits = 0;
    for (const [angle, words] of Object.entries(ANGLES)) {
      const hits = words.reduce((a, w) => a + (text.includes(w) ? 1 : 0), 0);
      if (hits > bestHits) [best, bestHits] = [angle, hits];
    }
    counts.set(best, (counts.get(best) ?? 0) + 1);
  }
  return [...counts]
    .map(([angle, c]) => ({ angle, share: c / ms.length }))
    .sort((a, b) => b.share - a.share)
    .slice(0, 5);
}

/* ---------- timeline ---------- */

const FIRST_LABEL: Record<SourceTypeId, string> = {
  primary: "Primary document published",
  government: "Government statement released",
  state: "State-run media reports",
  national: "National outlets begin reporting",
  regional: "Regional reports emerge",
  independent: "Independent reporting published",
  journalist: "Independent journalist reporting published",
  community: "Community reports appear",
  social: "Claim begins circulating online",
};

export function timelineFor(ms: MemberRow[]) {
  const events: { at: string; label: string; type: SourceTypeId | null; articleId: string | null }[] = [];
  const seenTypes = new Set<SourceTypeId>();
  const seenSources = new Set<string>();
  for (const m of ms) {
    if (!seenTypes.has(m.sourceType)) {
      seenTypes.add(m.sourceType);
      events.push({ at: m.publishedAt, label: `${FIRST_LABEL[m.sourceType]} (${m.sourceName})`, type: m.sourceType, articleId: m.id });
    }
    seenSources.add(m.sourceId);
    if (seenSources.size === 5 || seenSources.size === 10 || seenSources.size === 20)
      events.push({ at: m.publishedAt, label: `Coverage reaches ${seenSources.size} sources`, type: null, articleId: null });
  }
  return events;
}

/* ---------- persist ---------- */

export async function deriveStory(db: Db, storyId: string) {
  const ms = await loadMembers(db, storyId);
  if (!ms.length) return;
  await db.execute(`UPDATE stories SET summary = $1 WHERE id = $2`, [extractiveSummary(ms), storyId]);

  await db.execute(`DELETE FROM story_emphasis WHERE story_id = $1`, [storyId]);
  const emph = emphasisByType(ms);
  for (const t of SOURCE_TYPE_IDS) if (emph.has(t)) await db.execute(`INSERT INTO story_emphasis (story_id, source_type, points) VALUES ($1,$2,$3)`, [storyId, t, JSON.stringify(emph.get(t))]);

  await db.execute(`DELETE FROM story_angles WHERE story_id = $1`, [storyId]);
  for (const a of anglesFor(ms)) await db.execute(`INSERT INTO story_angles (story_id, angle, share, note) VALUES ($1,$2,$3,NULL)`, [storyId, a.angle, a.share]);

  await db.execute(`DELETE FROM timeline_events WHERE story_id = $1`, [storyId]);
  for (const e of timelineFor(ms)) await db.execute(`INSERT INTO timeline_events (story_id, at, label, source_type, article_id) VALUES ($1,$2,$3,$4,$5)`, [storyId, e.at, e.label, e.type, e.articleId]);

  await db.execute(`DELETE FROM evidence WHERE story_id = $1`, [storyId]);
  for (const m of ms) {
    if (m.sourceType === "primary") await db.execute(`INSERT INTO evidence (story_id, kind, title, publisher, url, published_at) VALUES ($1,$2,$3,$4,$5,$6)`, [storyId, "document", m.headline, m.sourceName, m.url, m.publishedAt]);
    else if (m.sourceType === "government") await db.execute(`INSERT INTO evidence (story_id, kind, title, publisher, url, published_at) VALUES ($1,$2,$3,$4,$5,$6)`, [storyId, "statement", m.headline, m.sourceName, m.url, m.publishedAt]);
  }
}

/** Attach unlinked fact-checks from the last 7 days to the most similar story (if similar enough). */
export async function linkFactChecks(db: Db, storyIds: string[], now = Date.now()) {
  const fcs = (await db.query(`SELECT id, claim FROM fact_checks WHERE story_id IS NULL AND published_at >= $1`, [new Date(now - 7 * 86400_000).toISOString()])) as { id: number; claim: string }[];
  if (!fcs.length || !storyIds.length) return 0;
  const stories = await Promise.all(storyIds.map(async (id) => ({ id, ms: await loadMembers(db, id) })));
  const docs = [...stories.map((s) => termFreq(tokenize(s.ms.map((m) => m.headline).join(" ")))), ...fcs.map((f) => termFreq(tokenize(f.claim)))];
  const idf = idfFrom(docs);
  const sv = stories.map((s, i) => ({ id: s.id, v: tfidf(docs[i], idf) }));
  let linked = 0;
  for (const [i, f] of fcs.entries()) {
    const v = tfidf(docs[stories.length + i], idf);
    let best: string | null = null, bestSim = 0;
    for (const s of sv) {
      const sim = cosine(v, s.v);
      if (sim > bestSim) [best, bestSim] = [s.id, sim];
    }
    if (best && bestSim >= 0.3) {
      await db.execute(`UPDATE fact_checks SET story_id = $1 WHERE id = $2`, [best, f.id]);
      linked++;
    }
  }
  return linked;
}
