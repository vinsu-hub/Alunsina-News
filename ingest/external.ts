/** Agent Reach JSONL handoff: metadata only; archive only after DB commit. */
import { lstat, mkdir, readdir, readFile, rename, unlink } from "node:fs/promises";
import path from "node:path";
import { FEEDS, type FeedSource } from "../config/feeds";
import type { RawItem } from "./fetch";
import { cleanHeadline } from "./fetch";
import { canonicalUrl, makeExcerpt, stripHtml } from "./normalize";

const WEEK = 7 * 86400_000;
const webUrl = (value: unknown): URL | null => {
  if (typeof value !== "string") return null;
  try { const u = new URL(value); return /^(https?:)$/.test(u.protocol) && !u.username && !u.password ? u : null; } catch { return null; }
};
export function validateExternal(value: unknown, now = Date.now(), sources: FeedSource[] = FEEDS): RawItem | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  const source = sources.find((s) => s.id === v.sourceId && s.collector === "agent-reach");
  if (!source || v.collector !== "agent-reach") return null;
  const url = webUrl(v.url);
  const domain = new URL(source.homepage).hostname.replace(/^www\./, "");
  if (!url || !(url.hostname === domain || url.hostname.endsWith(`.${domain}`))) return null;
  if (typeof v.headline !== "string") return null;
  const headline = cleanHeadline(stripHtml(v.headline));
  if (headline.length < 10 || headline.length > 300) return null;
  if (typeof v.publishedAt !== "string" || typeof v.collectedAt !== "string") return null;
  const published = Date.parse(v.publishedAt), collected = Date.parse(v.collectedAt);
  if (!Number.isFinite(published) || !Number.isFinite(collected) || published < now - WEEK || published > now || collected > now || collected < published) return null;
  if (v.excerpt !== undefined && typeof v.excerpt !== "string") return null;
  if (v.imageUrl !== undefined && !webUrl(v.imageUrl)) return null;
  const imageUrl = webUrl(v.imageUrl)?.href ?? null;
  return { source, headline, url: canonicalUrl(url.href), excerpt: makeExcerpt(stripHtml(String(v.excerpt ?? ""))), publishedAt: new Date(published).toISOString(), byline: null, imageUrl, imageCredit: imageUrl ? source.name : null };
}
export interface ExternalBatch {
  items: RawItem[];
  files: string[];
  rejected: number;
  errors: string[];
}
export async function readExternal(now = Date.now(), dir = process.env.EXTERNAL_ITEMS_DIR): Promise<ExternalBatch> {
  const out: ExternalBatch = { items: [], files: [], rejected: 0, errors: [] };
  if (!dir) return out;
  try {
    for (const name of (await readdir(dir)).sort().filter((n) => n.endsWith(".jsonl"))) {
      const file = path.join(dir, name);
      try {
        const stat = await lstat(file);
        if (!stat.isFile() || stat.size > 10 * 1024 * 1024) { out.errors.push(`${name}: not a regular file or exceeds 10 MiB`); continue; }
        const lines = (await readFile(file, "utf8")).split(/\r?\n/).filter((l) => l.trim());
        for (const line of lines) {
          let item: RawItem | null = null;
          try { item = validateExternal(JSON.parse(line), now); } catch { /* invalid JSON is rejected */ }
          if (item) out.items.push(item); else out.rejected++;
        }
        out.files.push(file);
      } catch { out.errors.push(`${name}: read failed`); }
    }
  } catch { out.errors.push("External directory unavailable"); }
  return out;
}
export async function archiveExternal(batch: ExternalBatch, now = Date.now(), dir = process.env.EXTERNAL_ITEMS_DIR) {
  if (!dir) return;
  const processed = path.join(dir, "processed");
  await mkdir(processed, { recursive: true });
  for (const file of batch.files) await rename(file, path.join(processed, `${now}-${path.basename(file)}`));
  for (const name of await readdir(processed)) {
    const file = path.join(processed, name), stat = await lstat(file);
    // Archive filename records processing time, rather than the producer's mtime.
    const at = Number(name.split("-")[0]);
    if (stat.isFile() && Number.isFinite(at) && at < now - WEEK) await unlink(file);
  }
}
