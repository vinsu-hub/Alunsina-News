/**
 * Feed health check (`npm run check-feeds`).
 *
 * Fetches every feed in config/feeds.ts (15s timeout, browser-like User-Agent)
 * and reports HTTP status, item count and the latest item date. For feeds that
 * fail or return no items it fetches the publisher homepage and tries to
 * discover a working feed: `<link rel="alternate" type="application/rss+xml">`
 * tags first, then common paths (/feed, /feed/, /rss, /rss.xml, /index.xml).
 *
 * Usage:
 *   npm run check-feeds                # check config/feeds.ts
 *   npm run check-feeds -- --probe URL [URL...]   # check arbitrary feed/homepage URLs
 *   npm run check-feeds -- --json      # machine-readable output
 *
 * This script only reports; config/feeds.ts is edited by hand from its output
 * (set `verified: true` only for feeds that actually returned items).
 */
import Parser from "rss-parser";
import { FEEDS } from "../config/feeds";

export const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";
const TIMEOUT_MS = 15_000;

const parser = new Parser({ timeout: TIMEOUT_MS });

interface FeedResult {
  url: string;
  status: number | null;
  items: number;
  latest: string | null;
  error?: string;
}

async function get(url: string): Promise<{ status: number; body: string; finalUrl: string }> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/rss+xml, application/atom+xml, application/xml;q=0.9, text/xml;q=0.9, text/html;q=0.8, */*;q=0.5",
        "Accept-Language": "en-PH,en;q=0.9,fil;q=0.8",
      },
    });
    const body = await res.text();
    return { status: res.status, body, finalUrl: res.url || url };
  } finally {
    clearTimeout(t);
  }
}

export async function checkFeed(url: string): Promise<FeedResult> {
  try {
    const { status, body } = await get(url);
    if (status >= 400) return { url, status, items: 0, latest: null, error: `HTTP ${status}` };
    if (!/<(rss|feed|rdf:RDF)[\s>]/i.test(body.slice(0, 5000)))
      return { url, status, items: 0, latest: null, error: "not an RSS/Atom document" };
    const feed = await parser.parseString(body);
    const dates = feed.items
      .map((i) => Date.parse(i.isoDate ?? i.pubDate ?? ""))
      .filter((d) => !Number.isNaN(d));
    const latest = dates.length ? new Date(Math.max(...dates)).toISOString() : null;
    return { url, status, items: feed.items.length, latest };
  } catch (e) {
    const msg = e instanceof Error ? (e.name === "AbortError" ? "timeout" : e.message) : String(e);
    return { url, status: null, items: 0, latest: null, error: msg.slice(0, 120) };
  }
}

/** Look for a working feed starting from a homepage. */
export async function discover(homepage: string): Promise<FeedResult | null> {
  const candidates: string[] = [];
  try {
    const { body, finalUrl } = await get(homepage);
    const re = /<link\b[^>]*>/gi;
    for (const tag of body.match(re) ?? []) {
      if (!/rel=["']?alternate/i.test(tag)) continue;
      if (!/type=["']?application\/(rss|atom)\+xml/i.test(tag)) continue;
      const href = tag.match(/href=["']([^"']+)["']/i)?.[1];
      if (href) candidates.push(new URL(href.replace(/&amp;/g, "&"), finalUrl).toString());
    }
    const base = new URL(finalUrl);
    for (const p of ["/feed/", "/feed", "/rss", "/rss.xml", "/index.xml", "/feeds/posts/default"])
      candidates.push(new URL(p, base.origin).toString());
  } catch {
    const base = new URL(homepage);
    for (const p of ["/feed/", "/rss", "/rss.xml"]) candidates.push(new URL(p, base.origin).toString());
  }
  // Skip comment feeds.
  const seen = new Set<string>();
  for (const c of candidates) {
    if (seen.has(c) || /comments\/feed/i.test(c)) continue;
    seen.add(c);
    const r = await checkFeed(c);
    if (r.items > 0) return r;
  }
  return null;
}

const pad = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s.padEnd(n));

async function pool<T, R>(xs: T[], n: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(xs.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, xs.length) }, async () => {
      while (i < xs.length) {
        const k = i++;
        out[k] = await fn(xs[k]);
      }
    }),
  );
  return out;
}

async function main() {
  const args = process.argv.slice(2);
  const asJson = args.includes("--json");
  const probeIdx = args.indexOf("--probe");

  if (probeIdx >= 0) {
    const urls = args.slice(probeIdx + 1).filter((a) => !a.startsWith("--"));
    const res = await pool(urls, 6, async (u) => {
      const r = await checkFeed(u);
      if (r.items > 0) return { input: u, ...r };
      const d = await discover(u);
      return { input: u, ...(d ?? r), discovered: Boolean(d) };
    });
    if (asJson) console.log(JSON.stringify(res, null, 2));
    else
      for (const r of res)
        console.log(`${pad(r.input, 55)} ${r.items > 0 ? "OK " : "ERR"} ${String(r.items).padStart(3)}  ${r.latest ?? "-"}  ${r.items > 0 ? r.url : (r.error ?? "")}`);
    return;
  }

  const rows = await pool(FEEDS, 6, async (src) => {
    const feeds = await Promise.all(src.feeds.map(checkFeed));
    const ok = feeds.some((f) => f.items > 0);
    let suggestion: FeedResult | null = null;
    if (!ok) suggestion = await discover(src.homepage);
    return { id: src.id, name: src.name, verified: src.verified, feeds, ok, suggestion };
  });

  if (asJson) {
    console.log(JSON.stringify(rows, null, 2));
    return;
  }
  console.log(`${pad("SOURCE", 22)} ${pad("STATUS", 7)} ${"ITEMS".padStart(5)}  ${pad("LATEST", 20)}  URL / NOTE`);
  for (const r of rows) {
    if (!r.feeds.length)
      console.log(`${pad(r.id, 22)} ${pad("none", 7)} ${"-".padStart(5)}  ${pad("-", 20)}  (headline + link only)${r.suggestion ? `  → found ${r.suggestion.url} (${r.suggestion.items})` : ""}`);
    for (const f of r.feeds)
      console.log(
        `${pad(r.id, 22)} ${pad(f.items > 0 ? "OK" : String(f.status ?? "ERR"), 7)} ${String(f.items).padStart(5)}  ${pad(f.latest ?? "-", 20)}  ${f.url}${f.error ? `  [${f.error}]` : ""}`,
      );
    if (r.feeds.length && !r.ok)
      console.log(`${pad("", 22)} ${r.suggestion ? `→ discovered ${r.suggestion.url} (${r.suggestion.items} items, latest ${r.suggestion.latest})` : "→ no working feed discovered"}`);
  }
  const ok = rows.filter((r) => r.ok).length;
  console.log(`\n${ok}/${rows.length} sources have a working feed.`);
}

if (process.argv[1]?.endsWith("check-feeds.ts")) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
