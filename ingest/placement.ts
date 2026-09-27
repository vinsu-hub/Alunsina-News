import type { Db } from "../db/client";
import { PLACEMENT } from "../lib/thresholds";
import { REGIONS, SOURCE_TYPES } from "../lib/taxonomy";

/** Deliberately contains reporting facts only: no reader behaviour inputs. */
export interface PlacementInput {
  id: string;
  updatedAt: string;
  outlets: { id: string; type: string; region: string | null }[];
  related: boolean;
}
export type Subscores = Record<keyof typeof PLACEMENT.weights, number>;
export function scorePlacement(input: PlacementInput, nmax: number, now: number) {
  const outlets = input.outlets.filter(o => o.type !== "social");
  const n = new Set(outlets.map(o => o.id)).size;
  const subscores: Subscores = {
    sources: Math.log1p(n) / Math.log1p(Math.max(1, nmax, n)),
    diversity: new Set(outlets.filter(o => SOURCE_TYPES.some(t => t.id === o.type)).map(o => o.type)).size / 9,
    reach: new Set(outlets.filter(o => REGIONS.some(r => r.id === o.region)).map(o => o.region)).size / 18,
    recency: Math.exp(-Math.max(0, now - Date.parse(input.updatedAt)) / 3600_000 / 24),
    related: input.related ? 1 : 0,
  };
  return { id: input.id, subscores, score: (Object.keys(subscores) as (keyof Subscores)[]).reduce((sum, key) => sum + subscores[key] * PLACEMENT.weights[key], 0) };
}
/** Latest 06:00/18:00 boundary in Manila (UTC+8, no daylight saving). */
export function editionBoundary(now: number): string {
  const offset = 8 * 3600_000;
  const shifted = new Date(now + offset);
  const day = Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate());
  const hour = shifted.getUTCHours();
  return new Date(day + (hour >= 18 ? 18 : hour >= 6 ? 6 : -6) * 3600_000 - offset).toISOString();
}
// Link generation recomputes rows each ingest. Use the linked event's last
// update rather than row creation time, so an old chain cannot stay fresh forever.
const RECENT_LINK = `EXISTS (SELECT 1 FROM story_links l JOIN public_stories target ON target.id=l.related_story_id
 WHERE l.story_id=st.id AND l.confidence >= 0.6 AND target.updated_at >= $2 AND target.updated_at <= $1)`;

/** Call inside the ingest transaction: unique edition_at also guards concurrent callers. */
export async function runEditorialEdition(db: Db, now = Date.now()) {
  const at = new Date(now).toISOString();
  const relatedSince = new Date(now - 48 * 3600_000).toISOString();
  await db.execute(`UPDATE stories st SET status=CASE
    WHEN st.created_at > $3 OR ${RECENT_LINK} THEN 'developing'
    WHEN st.updated_at < $2 THEN 'settled' ELSE 'ongoing' END`,
    [at, relatedSince, new Date(now - 12 * 3600_000).toISOString()]);
  await db.execute(`DELETE FROM story_scores WHERE scored_at < $1`, [new Date(now - 60 * 86400_000).toISOString()]);
  const boundary = editionBoundary(now);
  const edition = await db.one<{ id: number }>(`INSERT INTO editions(edition_at,window_label,created_at) VALUES($1,$2,$3)
    ON CONFLICT(edition_at) DO NOTHING RETURNING id`, [boundary, `${new Date(Date.parse(boundary) + 8 * 3600_000).toISOString().slice(0,16).replace('T',' ')} Asia/Manila`, at]);
  if (!edition) return null;
  const stories = await db.query<{ id: string; updated_at: string; related: boolean; title: string }>(`SELECT st.id,st.title,st.updated_at,${RECENT_LINK} related
    FROM public_stories st WHERE st.updated_at >= $3 AND st.updated_at <= $1
    AND (SELECT COUNT(DISTINCT a.source_id) FROM public_articles a JOIN sources s ON s.id=a.source_id WHERE a.story_id=st.id AND s.type <> 'social') >= 2`,
    [at, relatedSince, new Date(now - 72 * 3600_000).toISOString()]);
  const members = await db.query<{ story_id: string; id: string; type: string; region: string | null }>(`SELECT a.story_id,s.id,s.type,a.region
    FROM public_articles a JOIN sources s ON s.id=a.source_id WHERE a.story_id=ANY($1::text[]) AND s.type <> 'social'`, [stories.map(s => s.id)]);
  const inputs = stories.map(s => ({ id: s.id, updatedAt: s.updated_at, related: s.related, outlets: members.filter(m => m.story_id === s.id) }));
  const nmax = Math.max(1, ...inputs.map(s => new Set(s.outlets.map(o => o.id)).size));
  const scores = inputs.map(s => scorePlacement(s, nmax, now)).sort((a,b) => b.score-a.score || Date.parse(inputs.find(s=>s.id===b.id)!.updatedAt)-Date.parse(inputs.find(s=>s.id===a.id)!.updatedAt) || a.id.localeCompare(b.id));
  for (const [i,s] of scores.entries()) {
    const values = [edition.id,s.id,i+1,s.score,JSON.stringify(s.subscores)];
    await db.execute(`INSERT INTO story_scores(story_id,scored_at,score,subscores) VALUES($1,$2,$3,$4)`, [s.id,at,s.score,JSON.stringify(s.subscores)]);
    const slots = [...(i===0 ? ['lead'] : []), ...(i<5 ? ['briefing'] : []), ...(i>=1 && i<4 ? ['featured'] : []), ...(i>=4 && i<16 ? ['top'] : [])];
    for (const slot of slots) await db.execute(`INSERT INTO edition_placements(edition_id,story_id,rank,score,subscores,slot) VALUES($1,$2,$3,$4,$5,$6)`, [...values,slot]);
  }
  console.log(`Edition ${boundary}: lead + top 5 (frozen)`);
  for (const [i,s] of scores.slice(0,5).entries()) console.log(`${i===0 ? 'LEAD / ' : ''}Briefing ${i+1}: ${stories.find(st=>st.id===s.id)!.title} score=${s.score.toFixed(4)} ${JSON.stringify(s.subscores)}`);
  return { id: edition.id, editionAt: boundary, scores };
}
