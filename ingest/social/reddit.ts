/** Reddit Data API: application-only OAuth, top/day and bounded topic searches. */
import { apiJson, publicMetrics, RateLimitError, topicQuery, type SocialResult, type SocialSignal } from "./common";
import { stripHtml } from "../normalize";
export const DEFAULT_SUBREDDITS = ["Philippines", "Cebu", "davao", "Iloilo", "Bacolod", "CagayanDeOro", "baguio", "manila"];
export async function fetchReddit(topics: string[], now = Date.now(), request: typeof fetch = fetch, env: NodeJS.ProcessEnv = process.env): Promise<SocialResult> {
  const out: SocialResult = { items: [], errors: [] };
  if (!env.REDDIT_CLIENT_ID || !env.REDDIT_CLIENT_SECRET || !env.REDDIT_USER_AGENT) return out;
  const headers = { "User-Agent": env.REDDIT_USER_AGENT };
  try {
    const auth = await apiJson("https://www.reddit.com/api/v1/access_token", {
      method: "POST", headers: { ...headers, Authorization: `Basic ${Buffer.from(`${env.REDDIT_CLIENT_ID}:${env.REDDIT_CLIENT_SECRET}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" }, body: "grant_type=client_credentials",
    }, request) as { access_token?: string };
    if (!auth.access_token) throw new Error("missing OAuth token");
    const subs = (env.REDDIT_SUBREDDITS?.split(",") ?? DEFAULT_SUBREDDITS).map((s) => s.trim()).filter((s) => /^[A-Za-z0-9_]{2,32}$/.test(s)).slice(0, 20);
    const paths = subs.map((s) => `/r/${s}/top?t=day&limit=25&raw_json=1`);
    for (const topic of [...new Set(topics.map(topicQuery).filter(Boolean))].slice(0, 5)) paths.push(`/r/${subs.join("+")}/search?q=${encodeURIComponent(topic)}&restrict_sr=on&sort=top&t=day&limit=25&raw_json=1`);
    const seen = new Set<string>();
    for (const route of paths) {
      try {
        const data = await apiJson(`https://oauth.reddit.com${route}`, { headers: { ...headers, Authorization: `Bearer ${auth.access_token}` } }, request) as { data?: { children?: { data?: Record<string, unknown> }[] } };
        for (const node of data.data?.children ?? []) {
          const p = node.data;
          if (!p || typeof p.title !== "string" || typeof p.permalink !== "string" || typeof p.subreddit !== "string" || typeof p.created_utc !== "number") continue;
          if (!/^\/r\/[A-Za-z0-9_]+\/comments\/[A-Za-z0-9]+\//.test(p.permalink)) continue;
          const at = p.created_utc * 1000;
          if (!Number.isFinite(at) || at < now - 86400_000 || at > now || !subs.some((s) => s.toLowerCase() === String(p.subreddit).toLowerCase())) continue;
          const url = `https://www.reddit.com${p.permalink}`;
          if (seen.has(url)) continue;
          seen.add(url);
          const item: SocialSignal = { platform: "reddit", title: stripHtml(p.title).slice(0, 300), url, subreddit: p.subreddit, publishedAt: new Date(at).toISOString(), metrics: publicMetrics({ score: p.score }) };
          if (item.title.length >= 10) out.items.push(item);
        }
      } catch (error) { out.errors.push(`reddit: ${error instanceof Error ? error.message : "request failed"}`); if (error instanceof RateLimitError) break; }
    }
  } catch (error) { out.errors.push(`reddit: ${error instanceof Error ? error.message : "OAuth failed"}`); }
  return out;
}
