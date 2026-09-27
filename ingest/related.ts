/**
 * Separate events in one continuing situation. Same topic + a shared title
 * entity are mandatory; moderate centroid similarity and time separation
 * distinguish these links from same-event coverage. This is a heuristic,
 * confidence-gated relationship, not a claim of proven causality.
 */
import type { Db } from "../db/client";
import { CLUSTERING, RELATED_STORIES } from "../lib/thresholds";
import { centroid, cosine, entities, idfFrom, termFreq, tfidf, tokenize, type Vec } from "./text";

interface Story {
  id: string;
  title: string;
  topic: string;
  created_at: string;
}
export interface RelatedResult {
  links: number;
  examples: { earlier: string; later: string; confidence: number }[];
}

export async function linkRelatedStories(db: Db, now = Date.now()): Promise<RelatedResult> {
  const since = new Date(now - RELATED_STORIES.maxGapDays * 86400_000).toISOString();
  const stories = await db.query<Story>(`SELECT id,title,topic,created_at FROM stories WHERE created_at >= $1 AND created_at <= $2 ORDER BY created_at,id`, [since, new Date(now).toISOString()]);
  const articles = await db.query<{ story_id: string; headline: string; excerpt: string }>(`SELECT a.story_id,a.headline,a.excerpt FROM articles a JOIN stories s ON s.id=a.story_id WHERE s.created_at >= $1 AND s.created_at <= $2 AND a.source_id IN (SELECT id FROM sources WHERE type <> 'social') AND NOT EXISTS (SELECT 1 FROM pitch_publications pp WHERE pp.article_id=a.id AND pp.screening_status <> 'passed')`, [since, new Date(now).toISOString()]);
  const tfs = articles.map((a) => termFreq(tokenize(a.excerpt ?? ""), 1, termFreq(tokenize(a.headline), 2)));
  const idf = idfFrom(tfs);
  const members = new Map<string, Vec[]>();
  articles.forEach((a, i) => {
    const list = members.get(a.story_id) ?? [];
    list.push(tfidf(tfs[i], idf));
    members.set(a.story_id, list);
  });
  const vectors = new Map([...members].map(([id, vs]) => [id, centroid(vs)]));
  const named = new Map(stories.map((s) => [s.id, entities(s.title)]));
  // Recompute current-window links so changed centroids cannot leave stale matches.
  await db.execute(`DELETE FROM story_links WHERE story_id IN (SELECT id FROM stories WHERE created_at >= $1) AND related_story_id IN (SELECT id FROM stories WHERE created_at >= $1)`, [since]);
  const result: RelatedResult = { links: 0, examples: [] };
  for (let i = 0; i < stories.length; i++) {
    const a = stories[i];
    const av = vectors.get(a.id);
    if (!av) continue;
    for (let j = i + 1; j < stories.length; j++) {
      const b = stories[j];
      const gapHours = (Date.parse(b.created_at) - Date.parse(a.created_at)) / 3600_000;
      if (gapHours < 6 || gapHours > RELATED_STORIES.maxGapDays * 24 || a.topic !== b.topic) continue;
      const bv = vectors.get(b.id);
      if (!bv) continue;
      const shared = [...named.get(a.id)!].filter((e) => named.get(b.id)!.has(e)).length;
      if (!shared) continue;
      const sim = cosine(av, bv);
      // Similarity at/above the coverage threshold belongs to clustering.
      if (sim < 0.12 || sim >= CLUSTERING.similarity) continue;
      const confidence = Math.min(1, 0.4 + 0.3 * (sim / CLUSTERING.similarity) + 0.1 * Math.min(shared, 2));
      if (confidence < RELATED_STORIES.minConfidenceShown) continue;
      // Relation describes the target from the source story's perspective.
      await db.execute(`INSERT INTO story_links (story_id,related_story_id,relation,confidence) VALUES ($1,$2,'later',$3),($2,$1,'earlier',$3) ON CONFLICT(story_id,related_story_id) DO UPDATE SET relation=excluded.relation,confidence=excluded.confidence`, [a.id, b.id, confidence]);
      result.links += 2;
      if (result.examples.length < 3) result.examples.push({ earlier: a.title, later: b.title, confidence });
    }
  }
  return result;
}
