import "server-only";
import { getDb, type Row } from "@/db/client";
export interface GovernmentRequest extends Row {
 id: string; received_at: string; request_type: string; legal_basis: string; agency: string | null;
 story_id: string | null; source_id: string | null; summary: string; outcome: string; outcome_note: string; published: boolean;
 story_title?: string | null; source_name?: string | null;
}
export interface IndependenceSetting { enabled: boolean; reviewer?: string; reviewedAt?: string }
export async function listGovernmentRequests() {
 return (await getDb()).query<GovernmentRequest>(`SELECT g.*,s.title story_title,src.name source_name FROM gov_requests g LEFT JOIN public_stories s ON s.id=g.story_id LEFT JOIN sources src ON src.id=g.source_id WHERE g.published=true ORDER BY g.received_at DESC,g.created_at DESC`);
}
export async function hasGovernmentRequest(storyId: string) {
 return Boolean(await (await getDb()).one(`SELECT 1 FROM gov_requests WHERE story_id=$1 AND published=true LIMIT 1`,[storyId]));
}
export async function getIndependenceSetting(): Promise<IndependenceSetting> {
 const row=await (await getDb()).one<{value: IndependenceSetting}>(`SELECT value FROM site_settings WHERE key='independence_pledge'`);
 return row?.value ?? {enabled:false};
}
