import Link from "next/link";
import { MetaLine } from "@/components/ui";
import type { StorySummary } from "@/lib/types";
import { briefingReadTime, plural } from "@/lib/format";

/** §14: compact numbered list of five. The header summarizes only the briefing. */
export function DailyBriefing({ stories }: { stories: StorySummary[] }) {
  const items = stories.slice(0, 5);
  return (
    <section aria-labelledby="briefing-title">
      <header className="section-head mb-3">
        <h2 id="briefing-title" className="kicker mt-2 text-ink">
          Daily Briefing
        </h2>
        <p className="meta mt-1">
          {plural(items.length, "story", "stories")} · {briefingReadTime(items.length)}
        </p>
      </header>
      {items.length === 0 ? (
        <p className="meta">Today&apos;s briefing is being prepared.</p>
      ) : (
        <ol className="divide-y divide-rule">
          {items.map((s, i) => (
            <li key={s.id} className="grid grid-cols-[2rem_1fr] gap-x-2 py-3 first:pt-1">
              <span className="font-serif text-[34px] leading-none font-light text-terracotta tabular-nums" aria-hidden>
                {i + 1}
              </span>
              <div className="min-w-0">
                <span className="kicker text-forest">{s.topic}</span>
                <h3 className="headline mt-0.5 text-[17px] leading-snug">
                  <Link href={`/story/${s.id}`} className="hover:underline decoration-1 underline-offset-4">
                    {s.title}
                  </Link>
                </h3>
                <MetaLine stats={s.stats} updatedAt={s.updatedAt} className="mt-1" />
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
