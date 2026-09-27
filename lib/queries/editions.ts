import "server-only";
import { getDb } from "@/db/client";

export async function latestEditionPlacements() {
  const db = await getDb();
  const edition = await db.one<{ id: number; edition_at: string }>(`SELECT id,edition_at FROM editions ORDER BY edition_at DESC LIMIT 1`);
  if (!edition) return null;
  const placements = await db.query<{ slot: string; rank: number; story_id: string }>(`SELECT p.slot,p.rank,p.story_id FROM edition_placements p
    JOIN public_stories s ON s.id=p.story_id WHERE p.edition_id=$1 ORDER BY p.rank`, [edition.id]);
  const stories = await db.query(`SELECT s.* FROM public_stories s WHERE s.id=ANY($1::text[])`, [placements.map(p=>p.story_id)]);
  return { edition, placements, stories };
}
