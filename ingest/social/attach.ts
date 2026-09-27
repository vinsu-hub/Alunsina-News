import type { Db } from "../../db/client";
import type { SocialSignal } from "./common";
import { articleId } from "../normalize";
import { CLUSTERING } from "../../lib/thresholds";
import { cosine, centroid, idfFrom, termFreq, tfidf, tokenize } from "../text";

/** Attach a signal only when it meets the existing story-clustering threshold. */
export async function attachSocial(db: Db, signals: SocialSignal[], now = Date.now()) {
  let inserted = 0, attached = 0, unmatched = 0;
  const rawStories = await db.query<{ id: string; title: string; headline: string; excerpt: string }>(`SELECT st.id,st.title,a.headline,a.excerpt FROM public_stories st JOIN articles a ON a.story_id=st.id JOIN sources s ON s.id=a.source_id WHERE st.updated_at >= $1 AND s.type <> 'social'`, [new Date(now - CLUSTERING.windowHours * 3600_000).toISOString()]);
  const grouped = new Map<string, { title: string; docs: string[] }>();
  for (const row of rawStories) { const g = grouped.get(row.id) ?? { title: row.title, docs: [] }; g.docs.push(`${row.headline} ${row.excerpt ?? ""}`); grouped.set(row.id,g); }
  const stories = [...grouped].map(([id,g]) => ({ id, title:g.title, docs:g.docs }));
  for (const signal of signals) {
    // Headline-only term-vector comparison uses the same clustering token weights.
    const documents = [signal.title, ...stories.flatMap((s) => s.docs)];
    const vectors = documents.map((h) => termFreq(tokenize(h), 1));
    const idf = idfFrom(vectors);
    const candidate = tfidf(vectors[0], idf);
    let best: string | null = null, bestScore = 0;
    for (const story of stories) {
      const indices = story.docs.map((_, i) => i + 1);
      const score = cosine(candidate, centroid(indices.map((i) => tfidf(vectors[i], idf))));
      if (score > bestScore) { best=story.id; bestScore=score; }
    }
    // Existing stories with very short/shared vocabulary are deliberately skipped.
    if (!best || bestScore < CLUSTERING.similarity) { unmatched++; continue; }
    const srcId = signal.platform === "reddit" ? "social-reddit" : "social-x";
    await db.execute(`INSERT INTO sources (id,name,type,ownership,ownership_source,data_status,paywalled,homepage,regions,languages,topics,active)
       VALUES ($1,$2,'social','Not applicable — aggregated public posts','Official platform API','link',0,$3,'[]','["en","fil"]','[]',1)
       ON CONFLICT(id) DO NOTHING`, [srcId, signal.platform === "reddit" ? "Reddit" : "X", signal.platform === "reddit" ? "https://www.reddit.com" : "https://x.com"]);
    const hash = articleId(signal.url);
    const ins = await db.execute(`INSERT INTO articles (id,source_id,story_id,headline,byline,url,excerpt,published_at,language,region,fetched_at)
      VALUES ($1,$2,$3,$4,NULL,$5,'', $6,'en',NULL,$7) ON CONFLICT (url) DO NOTHING`, [hash, srcId, best, signal.title, signal.url, signal.publishedAt, new Date(now).toISOString()]);
    inserted += Number(ins.changes);
    if (ins.changes) {
      await db.execute(`INSERT INTO social_signals(article_id,platform,subreddit,metrics) VALUES ($1,$2,$3,$4) ON CONFLICT(article_id) DO NOTHING`, [hash, signal.platform, signal.subreddit ?? null, JSON.stringify(signal.metrics)]);
      attached++;
    }
  }
  return { inserted, attached, unmatched };
}
