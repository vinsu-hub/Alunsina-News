// Formatting helpers. All wall-clock output is in Philippine time.
const TZ = "Asia/Manila";

export function timeAgo(iso: string, now = Date.now()): string {
  const s = Math.max(0, (now - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return shortDate(iso);
}

/** "FRI, SEP 26, 2025" — masthead edition date. */
export const editionDate = (d: Date | string = new Date()) =>
  new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  })
    .format(new Date(d))
    .toUpperCase();

export const shortDate = (iso: string) =>
  new Intl.DateTimeFormat("en-US", { timeZone: TZ, month: "short", day: "numeric" }).format(new Date(iso));

/** "08:30" in Manila time — story timeline. */
export const clockTime = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

export const pct = (x: number) => `${Math.round(x * 100)}%`;

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** Rough reading time for a briefing: ~1 min per story. */
export const briefingReadTime = (stories: number) => `~${Math.max(1, stories)} min read`;
