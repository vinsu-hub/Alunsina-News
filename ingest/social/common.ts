/** Official API metadata only. Never retain author identities or comment bodies. */
export interface SocialSignal {
  platform: "reddit" | "x";
  title: string;
  url: string;
  publishedAt: string;
  subreddit?: string;
  metrics: Record<string, number>;
}
export interface SocialResult { items: SocialSignal[]; errors: string[] }
export function publicMetrics(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object") return {};
  return Object.fromEntries(Object.entries(value).filter(([key, n]) => /^(score|retweet_count|reply_count|like_count|quote_count|bookmark_count|impression_count)$/.test(key) && typeof n === "number" && Number.isFinite(n) && n >= 0));
}
export function topicQuery(title: string): string {
  // Strip API query operators; select substantive terms from actual leading headlines.
  return title.replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter((w) => w.length > 3 && !/^(with|from|that|this|have|will|after|over|into|says|said)$/i.test(w)).slice(0, 6).join(" ");
}
export class RateLimitError extends Error {}
export async function apiJson(url: string | URL, init: RequestInit, request: typeof fetch): Promise<unknown> {
  const res = await request(url, { ...init, signal: AbortSignal.timeout(12_000) });
  if (res.status === 429) throw new RateLimitError("rate limited; defer until a later ingest run");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data: unknown = await res.json();
  // Stop this run once the official remaining budget is exhausted (no immediate retry).
  if (res.headers.get("x-ratelimit-remaining") === "0") throw new RateLimitError("API budget exhausted; defer until a later ingest run");
  return data;
}
