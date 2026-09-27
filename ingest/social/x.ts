/** Official X API v2 recent search. No cookies, scraping, users, or expansions to authors. */
import { apiJson, publicMetrics, RateLimitError, topicQuery, type SocialResult } from "./common";
import { stripHtml } from "../normalize";
export async function fetchX(topics: string[], now = Date.now(), request: typeof fetch = fetch, env: NodeJS.ProcessEnv = process.env): Promise<SocialResult> {
  const out: SocialResult = { items: [], errors: [] };
  if (!env.X_BEARER_TOKEN) return out;
  const seen = new Set<string>();
  for (const topic of [...new Set(topics.map(topicQuery).filter(Boolean))].slice(0, 5)) {
    const url = new URL("https://api.x.com/2/tweets/search/recent");
    url.searchParams.set("query", `(${topic}) (lang:en OR lang:tl) -is:retweet${env.X_REQUIRE_PH_PLACE === "true" ? " place_country:PH" : ""}`);
    url.searchParams.set("max_results", "25");
    url.searchParams.set("start_time", new Date(now - 86400_000).toISOString());
    url.searchParams.set("tweet.fields", "created_at,public_metrics,geo");
    url.searchParams.set("expansions", "geo.place_id");
    url.searchParams.set("place.fields", "country_code");
    try {
      const data = await apiJson(url, { headers: { Authorization: `Bearer ${env.X_BEARER_TOKEN}` } }, request) as { data?: { id?: string; text?: string; created_at?: string; public_metrics?: unknown; geo?: { place_id?: string } }[]; includes?: { places?: { id: string; country_code?: string }[] } };
      const places = new Map(data.includes?.places?.map((p) => [p.id, p.country_code]) ?? []);
      for (const p of data.data ?? []) {
        if (!p.id || !/^\d+$/.test(p.id) || typeof p.text !== "string" || !p.created_at || seen.has(p.id)) continue;
        const at = Date.parse(p.created_at), country = p.geo?.place_id ? places.get(p.geo.place_id) : undefined;
        if (!Number.isFinite(at) || at < now - 86400_000 || at > now || (country && country !== "PH")) continue;
        seen.add(p.id);
        // Remove @mentions so no usernames reach the UI, while retaining topical text.
        const title = stripHtml(p.text).replace(/@[A-Za-z0-9_]+/g, "[account]").slice(0, 280);
        if (title.length >= 10) out.items.push({ platform: "x", title, url: `https://x.com/i/web/status/${p.id}`, publishedAt: new Date(at).toISOString(), metrics: publicMetrics(p.public_metrics) });
      }
    } catch (error) { out.errors.push(`x: ${error instanceof Error ? error.message : "request failed"}`); if (error instanceof RateLimitError) break; }
  }
  return out;
}
