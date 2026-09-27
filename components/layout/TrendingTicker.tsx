import Link from "next/link";
import type { TrendingTerm } from "@/lib/queries/trends";

export function TrendingTicker({ terms = [] }: { terms?: TrendingTerm[] }) {
  return <div className="border-b border-rule bg-paper-deep/60"><div className="no-scrollbar mx-auto flex max-w-[1440px] items-center gap-3 overflow-x-auto px-4 py-2.5 md:px-6">
    <Link href="/trends" className="kicker shrink-0 text-terracotta">Trending this week →</Link>
    <ul className="flex shrink-0 items-center gap-3 font-sans text-[11px] text-ink-soft">{terms.slice(0,9).map((t) => <li key={t.slug}><Link href={`/trends/${t.slug}`} className="whitespace-nowrap hover:text-ink hover:underline underline-offset-4">{t.term}{t.change !== "steady" && <span className="ml-1 text-forest" aria-label={t.change === "new" ? "New this week" : "Coverage increased"}>{t.change === "new" ? "NEW" : "↑"}</span>}</Link></li>)}</ul>
    <Link href="/topics" className="shrink-0 text-xs text-forest">Topics →</Link>
  </div></div>;
}
