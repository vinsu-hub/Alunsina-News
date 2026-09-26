import { getDb } from "@/db/client";
import { createFlag } from "@/lib/queries";
import type { FlagInput } from "@/lib/types";

const attempts = new Map<string, { count: number; until: number }>();
const kinds = ["coverage_mismatch", "related_mismatch", "source_miscategorized"];
export async function POST(request: Request) {
  let value: unknown;
  try { value = await request.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (!value || typeof value !== "object" || Array.isArray(value)) return Response.json({ error: "Invalid flag" }, { status: 400 });
  const input = value as Record<string, unknown>;
  const validId = (id: unknown): id is string => typeof id === "string" && id.trim().length > 0 && id.length <= 200;
  if (typeof input.kind !== "string" || !kinds.includes(input.kind) || !validId(input.targetId) || !validId(input.storyId) || (input.note !== undefined && (typeof input.note !== "string" || input.note.length > 500))) return Response.json({ error: "Invalid flag" }, { status: 400 });
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now = Date.now();
  for (const [key, entry] of attempts) if (entry.until <= now) attempts.delete(key);
  const entry = attempts.get(ip) ?? { count: 0, until: now + 60_000 };
  if (entry.count >= 10) return Response.json({ error: "Too many flags. Try again shortly." }, { status: 429, headers: { "Retry-After": String(Math.ceil((entry.until - now) / 1000)) } });
  entry.count++;
  attempts.set(ip, entry);
  const db = await getDb();
  const target = input.kind === "related_mismatch"
    ? await db.one("SELECT related_story_id FROM story_links WHERE story_id = $1 AND related_story_id = $2 AND confidence >= 0.6", [input.storyId, input.targetId])
    : await db.one("SELECT id FROM articles WHERE story_id = $1 AND id = $2", [input.storyId, input.targetId]);
  if (!target) return Response.json({ error: "Target does not belong to this story" }, { status: 400 });
  const flag = await createFlag({ kind: input.kind as FlagInput["kind"], storyId: input.storyId, targetId: input.targetId, note: (input.note as string | undefined) ?? "" });
  return Response.json({ flag }, { status: 201 });
}
