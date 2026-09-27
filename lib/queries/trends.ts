import "server-only";
import { getDb } from "@/db/client";
import { getStory, getTrendingTopics, listStories } from "@/lib/queries";
import { topicSlug } from "@/lib/taxonomy";

export interface TrendingTerm { term: string; slug: string; sources: number; stories: number; change: "new" | "up" | "steady"; topic?: string; }
export async function getTrendingTerms(limit = 20): Promise<TrendingTerm[]> {
  const db = await getDb();
  const rows = await db.query<{ term: string; slug: string; sources: number; stories: number; articles: number; prev_articles: number }>(`SELECT * FROM trending_terms WHERE window_start = (SELECT max(window_start) FROM trending_terms) ORDER BY score DESC,slug LIMIT $1`, [Math.max(0, Math.min(20, limit))]);
  if (rows.length) return rows.map((r) => ({ term: r.term, slug: r.slug, sources: r.sources, stories: r.stories, change: r.prev_articles === 0 ? "new" : r.articles > r.prev_articles ? "up" : "steady" }));
  return Promise.all((await getTrendingTopics()).slice(0, limit).map(async (t) => {
    const count = await db.one<{ n: number }>(`SELECT count(DISTINCT a.source_id)::int n FROM public_articles a JOIN public_stories st ON st.id=a.story_id JOIN sources s ON s.id=a.source_id WHERE st.topic=$1 AND s.type <> 'social'`, [t.topic]);
    return { term: t.topic, slug: topicSlug(t.topic), sources: count?.n ?? 0, stories: t.stories, change: "steady" as const, topic: t.topic };
  }));
}
export async function getTrend(slug: string) {
  const term = (await getTrendingTerms()).find((t) => t.slug === slug);
  if (!term) return null;
  if (term.topic) return { term, stories: await listStories({ topic: term.topic, limit: 40 }) };
  const db = await getDb();
  const rows = await db.query<{ story_id: string }>(`SELECT DISTINCT a.story_id FROM public_articles a JOIN sources s ON s.id=a.source_id WHERE s.type <> 'social' AND a.story_id IS NOT NULL AND a.published_at >= $1 AND a.published_at <= $2 AND a.headline ~* $3`, [new Date(Date.now()-7*86400_000).toISOString(),new Date().toISOString(),`\\m${term.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\M`]);
  const stories = (await Promise.all(rows.map((r) => getStory(r.story_id)))).filter((s) => s !== null);
  return { term, stories };
}
