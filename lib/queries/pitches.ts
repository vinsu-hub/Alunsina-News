import "server-only";
import { getDb } from "@/db/client";
import { REGIONS, type RegionId, type BlindspotTypeId } from "@/lib/taxonomy";
import { getStory } from "@/lib/queries";
export type PitchStatus = "pitched" | "in_progress" | "published";
export interface PublicPitch {
  pitchId: string; reporterId: string; topic: string; region: RegionId | null; regionLabel: string | null;
  angle: string; timeframe: string; status: PitchStatus; createdAt: string; updatedAt: string; statusChangedAt: string;
  contributor: { id: string; name: string; credentials: string; bio: string; kind: "journalist" | "expert"; isSample: boolean };
  linkedBlindspot: { id: number; type: BlindspotTypeId; storyId: string; storyTitle: string } | null;
  linkedStory: { id: string; title: string; summary: string } | null;
}
async function publicPitches(opts: { status?: PitchStatus; region?: string; limit?: number; contributorId?: string }): Promise<PublicPitch[]> {
  const rows = await (await getDb()).query<Record<string, unknown>>(`SELECT p.*, c.name,c.credentials,c.bio,c.kind,c.is_sample,
    b.id b_id,b.type b_type,bst.id b_story_id,bst.title b_story_title
    FROM pitches p JOIN contributors c ON c.id=p.reporter_id
    LEFT JOIN blindspots b ON b.id=p.linked_blindspot_id LEFT JOIN public_stories bst ON bst.id=b.story_id
    WHERE c.verified_at IS NOT NULL AND c.active AND p.screening_status='passed'
    AND (p.status <> 'published' OR EXISTS (SELECT 1 FROM pitch_publications pp WHERE pp.pitch_id=p.pitch_id AND pp.screening_status='passed'))
    AND ($1::text IS NULL OR p.status=$1) AND ($2::text IS NULL OR p.region=$2) AND ($3::text IS NULL OR c.id=$3)
    ORDER BY p.updated_at DESC,p.pitch_id LIMIT $4`, [opts.status ?? null, opts.region ?? null, opts.contributorId ?? null, Math.max(0, Math.min(100, Math.floor(opts.limit ?? 30)))]);
  return Promise.all(rows.map(async (r) => {
    const story = r.status === "published" && r.linked_story_id ? await getStory(String(r.linked_story_id)) : null;
    return {
      pitchId: String(r.pitch_id), reporterId: String(r.reporter_id), topic: String(r.topic), region: r.region as RegionId | null,
      regionLabel: REGIONS.find((x) => x.id === r.region)?.label ?? null,
      angle: String(r.angle), timeframe: String(r.timeframe), status: r.status as PitchStatus,
      createdAt: String(r.created_at), updatedAt: String(r.updated_at), statusChangedAt: String(r.status_changed_at),
      contributor: { id: String(r.reporter_id), name: String(r.name), credentials: String(r.credentials), bio: String(r.bio), kind: r.kind as "journalist" | "expert", isSample: Boolean(r.is_sample) },
      linkedBlindspot: r.b_story_id ? { id: Number(r.b_id), type: r.b_type as BlindspotTypeId, storyId: String(r.b_story_id), storyTitle: String(r.b_story_title) } : null,
      linkedStory: story ? { id: story.id, title: story.title, summary: story.summary } : null,
    };
  }));
}
export async function listPublicPitches(opts: { status?: PitchStatus; region?: string; limit?: number } = {}) { return publicPitches(opts); }
export async function getPitchesForContributor(contributorId: string) { return publicPitches({ contributorId, limit: 100 }); }
/** Detected blindspots are the current/open set; no claim or assignment exclusivity. */
export async function suggestBlindspotsForPitch(topic: string, region?: string | null) {
  const rows = await (await getDb()).query<{ id: number; type: BlindspotTypeId; storyId: string; storyTitle: string; reason: string; regionMatch: boolean }>(`SELECT b.id,b.type,b.story_id "storyId",s.title "storyTitle",b.reason,
    EXISTS (SELECT 1 FROM public_articles a WHERE a.story_id=s.id AND a.region=$1) "regionMatch"
    FROM blindspots b JOIN public_stories s ON s.id=b.story_id ORDER BY b.detected_at DESC LIMIT 200`, [region ?? null]);
  const tokens = new Set(topic.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []);
  return rows.map((r) => {
    const other = new Set(`${r.storyTitle} ${r.reason}`.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []);
    const intersection = [...tokens].filter((t) => other.has(t)).length;
    return { ...r, score: Number(r.regionMatch) + intersection / (new Set([...tokens, ...other]).size || 1) };
  }).sort((a, b) => b.score - a.score || b.id - a.id).slice(0, 8);
}
