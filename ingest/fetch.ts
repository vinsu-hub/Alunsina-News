/**
 * Fetches verified feeds from config/feeds.ts concurrently (limit 6) and
 * returns normalized items. A failing feed never aborts the run — its error
 * is recorded and the rest continue.
 */
import Parser from "rss-parser";
import { FEEDS, type FeedSource } from "../config/feeds";
import { canonicalUrl, makeExcerpt, stripHtml } from "./normalize";

export const FEED_USER_AGENT = "AlunsinaNewsBot/1.0 (+https://alunsina.news/methodology)";
const TIMEOUT_MS = 12_000;
const MAX_AGE_DAYS = 7;

export interface RawItem {
  source: FeedSource;
  headline: string;
  byline: string | null;
  url: string;
  excerpt: string;
  publishedAt: string;
  imageUrl: string | null;
  imageCredit: string | null;
}

export interface FetchResult {
  items: RawItem[];
  errors: { source: string; url: string; error: string }[];
  feedsOk: number;
}

type Item = Parser.Item & {
  mediaContent?: unknown;
  mediaThumbnail?: unknown;
  "content:encoded"?: string;
  creator?: string;
  "dc:creator"?: string;
  author?: string;
  contentSnippet?: string;
  summary?: string;
};
export const feedParser: Parser<object, Item> = new Parser({
  timeout: TIMEOUT_MS,
  customFields: {
    item: [
      ["media:content", "mediaContent", { keepArray: true }],
      ["media:thumbnail", "mediaThumbnail", { keepArray: true }],
      "content:encoded",
    ],
  },
});

/** Publisher-provided image only, never a relative or non-web URL. */
export function extractItemImage(item: Item): string | null {
  const valid = (value: unknown): string | null => {
    if (typeof value !== "string") return null;
    try {
      const url = new URL(value.replace(/&amp;/g, "&"));
      return ["http:", "https:"].includes(url.protocol) ? url.href : null;
    } catch {
      return null;
    }
  };
  const media = (value: unknown): string | null => {
    if (Array.isArray(value)) {
      for (const entry of value) {
        const url = media(entry);
        if (url) return url;
      }
      return null;
    }
    if (!value || typeof value !== "object") return null;
    const node = value as {
      $?: { url?: string; type?: string; medium?: string };
      url?: string;
    };
    if (node.$?.medium && node.$.medium !== "image") return null;
    if (node.$?.type && !node.$.type.startsWith("image/")) return null;
    return valid(node.$?.url ?? node.url);
  };
  const supplied = media(item.mediaContent) ?? media(item.mediaThumbnail);
  if (supplied) return supplied;
  if (item.enclosure?.type?.startsWith("image/")) {
    const url = valid(item.enclosure.url);
    if (url) return url;
  }
  for (const html of [item["content:encoded"], item.content, item.summary]) {
    const src = html?.match(
      /<img\b[^>]*\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i,
    );
    const url = valid(src?.[1] ?? src?.[2] ?? src?.[3]);
    if (url) return url;
  }
  return null;
}

async function fetchText(url: string): Promise<string> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        "User-Agent": FEED_USER_AGENT,
        Accept:
          "application/rss+xml, application/atom+xml, application/xml;q=0.9, */*;q=0.5",
      },
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

async function fetchFeed(
  source: FeedSource,
  url: string,
  now: number,
): Promise<RawItem[]> {
  const feed = await feedParser.parseString(await fetchText(url));
  const cutoff = now - MAX_AGE_DAYS * 86400_000;
  const out: RawItem[] = [];
  for (const it of feed.items) {
    if (!it.link || !it.title) continue;
    const ts = Date.parse(it.isoDate ?? it.pubDate ?? "");
    const published = Number.isNaN(ts) ? now : Math.min(ts, now);
    if (published < cutoff) continue;
    const body = stripHtml(it.contentSnippet ?? it.summary ?? it.content ?? "");
    const imageUrl = extractItemImage(it);
    out.push({
      source,
      headline: cleanHeadline(stripHtml(it.title)),
      byline: (it.creator ?? it["dc:creator"] ?? it.author ?? null) || null,
      url: canonicalUrl(it.link),
      excerpt: makeExcerpt(body),
      publishedAt: new Date(published).toISOString(),
      imageUrl,
      imageCredit: imageUrl ? source.name : null,
    });
  }
  return out;
}

export async function fetchAll(
  now = Date.now(),
  sources = FEEDS.filter((f) => f.verified && f.feeds.length),
): Promise<FetchResult> {
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
          items.push(
            ...(await fetchFeed(s, url, now).catch(() =>
              fetchFeed(s, url, now),
            )),
          ); // one retry
          feedsOk++;
        } catch (e) {
          const msg =
            e instanceof Error
              ? e.name === "AbortError"
                ? "timeout"
                : e.message
              : String(e);
          errors.push({ source: s.id, url, error: msg.slice(0, 160) });
        }
      }
    }),
  );
  // Same article can appear in two feeds of one publisher (e.g. headlines + nation).
  const seen = new Set<string>();
  return {
    items: items.filter((x) => !seen.has(x.url) && seen.add(x.url)),
    errors,
    feedsOk,
  };
}
