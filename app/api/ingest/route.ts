// POST /api/ingest — runs one ingestion pass. Requires `Authorization: Bearer $INGEST_TOKEN`.
// Called by the Modal cron in cron/ingest_cron.py.
import { timingSafeEqual } from "node:crypto";
import { getDb } from "@/db/client";
import { runIngest } from "@/ingest/pipeline";

export const maxDuration = 300; // Vercel Hobby ceiling

let running = false;

function authorized(req: Request): boolean {
  const token = process.env.INGEST_TOKEN;
  const got = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!token || !got) return false;
  const a = Buffer.from(got), b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  if (!process.env.INGEST_TOKEN) return Response.json({ error: "INGEST_TOKEN is not configured" }, { status: 503 });
  if (!authorized(req)) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (running) return Response.json({ error: "an ingest run is already in progress" }, { status: 409 });
  running = true;
  try {
    const summary = await runIngest(await getDb());
    return Response.json(summary);
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  } finally {
    running = false;
  }
}
