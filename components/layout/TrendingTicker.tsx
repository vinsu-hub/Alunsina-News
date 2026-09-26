import Link from "next/link";
import { TOPICS, topicSlug } from "@/lib/taxonomy";

/** "TRENDING TOPICS →" strip. Takes live topics if provided, else the default topic list. */
export function TrendingTicker({ topics }: { topics?: string[] }) {
  const list = topics?.length ? topics : TOPICS.slice(0, 9);
  return (
    <div className="border-b border-rule bg-paper-deep/60">
      <div className="no-scrollbar mx-auto flex max-w-[1440px] items-center gap-3 overflow-x-auto px-4 py-2.5 md:px-6">
        <span className="kicker shrink-0 text-terracotta">
          Trending topics →
        </span>
        <ul className="flex shrink-0 items-center gap-3 font-sans text-[11px] text-ink-soft">
          {list.map((t, i) => (
            <li key={t} className="flex items-center gap-3">
              {i > 0 && (
                <span className="text-rule" aria-hidden>
                  ·
                </span>
              )}
              <Link
                href={`/topics/${topicSlug(t)}`}
                className="whitespace-nowrap hover:text-ink hover:underline underline-offset-4"
              >
                {t}
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/topics" className="shrink-0 text-xs text-forest">
          More →
        </Link>
      </div>
    </div>
  );
}
