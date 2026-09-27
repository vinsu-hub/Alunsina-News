// Server-side module (used by Next route handlers/actions and the CLI ingest). Not marked "server-only"
// because the CLI ingest (tsx) must import it; never import it from a client component.
import { getDb, type Db } from "@/db/client";
export type ScreeningResult = { status: "passed" | "flagged" | "pending"; categories: string[]; screenedAt: string | null };
/** TODO: confirm Laya's response contract. Expected: { pass: boolean, categories: string[] }.
 * Unknown responses fail closed; this adapter is the only Laya-specific parser.
 * Presets check injection and content safety, never topics/viewpoints/official names.
 */
export function parseLayaResponse(value: unknown): Pick<ScreeningResult, "status" | "categories"> {
  if (!value || typeof value !== "object") return { status: "pending", categories: [] };
  const v = value as Record<string, unknown>;
  if (typeof v.pass !== "boolean" || !Array.isArray(v.categories) || !v.categories.every((c) => typeof c === "string")) return { status: "pending", categories: [] };
  return { status: v.pass ? "passed" : "flagged", categories: v.categories };
}
export async function prescreen(text: string, kind: "pitch" | "publication"): Promise<ScreeningResult> {
  const pending: ScreeningResult = { status: "pending", categories: [], screenedAt: null };
  if (!process.env.LAYA_URL) return pending;
  try {
    const response = await fetch(process.env.LAYA_URL, { method: "POST", headers: { "Content-Type": "application/json", ...(process.env.LAYA_TOKEN ? { Authorization: `Bearer ${process.env.LAYA_TOKEN}` } : {}) },
      body: JSON.stringify({ text, presets: ["guard_questions", "moderation_questions"], kind }), signal: AbortSignal.timeout(8000), cache: "no-store" });
    if (!response.ok) return pending;
    const parsed = parseLayaResponse(await response.json());
    return { ...parsed, screenedAt: parsed.status === "pending" ? null : new Date().toISOString() };
  } catch { return pending; }
}
/** Optional target enables admin re-runs of flagged/passed content too. No override exists. */
export async function rescreenPending(limit = 50, database?: Db, target?: { kind: "pitch" | "publication"; id: string }) {
  const db = database ?? await getDb();
  const size = Math.max(1, Math.min(50, Math.floor(limit)));
  const rows = target
    ? await db.query<{ id: string; kind: "pitch" | "publication"; text: string }>(target.kind === "pitch"
      ? `SELECT pitch_id id, 'pitch' kind, topic || E'\n' || angle || E'\n' || timeframe text FROM pitches WHERE pitch_id=$1`
      : `SELECT pitch_id id, 'publication' kind, headline || E'\n' || excerpt text FROM pitch_publications WHERE pitch_id=$1`, [target.id])
    : await db.query<{ id: string; kind: "pitch" | "publication"; text: string }>(`SELECT * FROM (
      SELECT pitch_id id, 'pitch' kind, topic || E'\n' || angle || E'\n' || timeframe text FROM pitches WHERE screening_status='pending'
      UNION ALL SELECT pitch_id id, 'publication' kind, headline || E'\n' || excerpt text FROM pitch_publications WHERE screening_status='pending') q ORDER BY id,kind LIMIT $1`, [size]);
  // Bounded concurrency: 50 * 8 seconds serially would exceed Vercel's 300-second limit.
  for (let i = 0; i < rows.length; i += 5) await Promise.all(rows.slice(i, i + 5).map(async (row) => {
    const result = await prescreen(row.text, row.kind);
    const table = row.kind === "pitch" ? "pitches" : "pitch_publications";
    // Compare original text so a concurrent edit cannot receive a stale screen.
    const text = row.kind === "pitch" ? "topic || E'\\n' || angle || E'\\n' || timeframe" : "headline || E'\\n' || excerpt";
    await db.execute(`UPDATE ${table} SET screening_status=$1,screening_categories=$2,screened_at=$3 WHERE pitch_id=$4 AND (${text})=$5`, [result.status, JSON.stringify(result.categories), result.screenedAt, row.id, row.text]);
  }));
  return { screened: rows.length };
}
