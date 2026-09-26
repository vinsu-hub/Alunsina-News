/**
 * Fetches verified feeds from config/feeds.ts concurrently (limit 6) and
 * returns normalized items. A failing feed never aborts the run — its error
 * is recorded and the rest continue.
 */
import Parser from "rss-parser";
import { FEEDS, type FeedSource } from "../config/feeds";
import { canonicalUrl, makeExcerpt, stripHtml } from "./normalize";

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";
const TIMEOUT_MS = 25_000;
const MAX_AGE_DAYS = 7;

export interface RawItem {
  source: FeedSource;
  headline: string;
  byline: string | null;
  url: string;
  excerpt: string;
  publishedAt: string;
}

export interface FetchResult {
  items: RawItem[];
  errors: { source: string; url: string; error: string }[];
  feedsOk: number;
}

type Item = Parser.Item & { creator?: string; "dc:creator"?: string; author?: string; contentSnippet?: string; summary?: string };
const parser: Parser<object, Item> = new Parser({ timeout: TIMEOUT_MS });

async function fetchText(url: string): Promise<string> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": UA, Accept: "application/rss+xml, application/atom+xml, application/xml;q=0.9, */*;q=0.5" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(t);
  }
}

/** Drops publisher/section prefixes and suffixes like "AbanTV – News | …" or "… | Philstar.com". */
export function cleanHeadline(h: string): string {
  return h
    .replace(/^[^|]{2,40}\s[|]\s+/, "")
    .replace(/\s+[|]\s+[^|]{2,40}$/, "")
    .trim();
}

async function fetchFeed(source: FeedSource, url: string, now: number): Promise<RawItem[]> {
  const feed = await parser.parseString(await fetchText(url));
  const cutoff = now - MAX_AGE_DAYS * 86400_000;
  const out: RawItem[] = [];
  for (const it of feed.items) {
    if (!it.link || !it.title) continue;
    const ts = Date.parse(it.isoDate ?? it.pubDate ?? "");
    const published = Number.isNaN(ts) ? now : Math.min(ts, now);
    if (published < cutoff) continue;
    const body = stripHtml(it.contentSnippet ?? it.summary ?? it.content ?? "");
    out.push({
      source,
      headline: cleanHeadline(stripHtml(it.title)),
      byline: (it.creator ?? it["dc:creator"] ?? it.author ?? null) || null,
      url: canonicalUrl(it.link),
      excerpt: makeExcerpt(body),
      publishedAt: new Date(published).toISOString(),
    });
  }
  return out;
}

export async function fetchAll(now = Date.now(), sources = FEEDS.filter((f) => f.verified && f.feeds.length)): Promise<FetchResult> {
  const jobs = sources.flatMap((s) => s.feeds.map((url) => ({ s, url })));
  const items: RawItem[] = [];
  const errors: FetchResult["errors"] = [];
  let feedsOk = 0;
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(6, jobs.length) }, async () => {
      while (i < jobs.length) {
        const { s, url } = jobs[i++];
        try {
          items.push(...(await fetchFeed(s, url, now).catch(() => fetchFeed(s, url, now)))); // one retry
          feedsOk++;
        } catch (e) {
          const msg = e instanceof Error ? (e.name === "AbortError" ? "timeout" : e.message) : String(e);
          errors.push({ source: s.id, url, error: msg.slice(0, 160) });
        }
      }
    }),
  );
  // Same article can appear in two feeds of one publisher (e.g. headlines + nation).
  const seen = new Set<string>();
  return { items: items.filter((x) => !seen.has(x.url) && seen.add(x.url)), errors, feedsOk };
}
