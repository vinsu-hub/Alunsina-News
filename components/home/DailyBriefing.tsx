import Link from "next/link";
import { CoverageChip } from "@/components/ui/CoverageChip";
import { StoryImage } from "@/components/ui/StoryImage";
import { timeAgo } from "@/lib/format";
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
          {plural(items.length, "story", "stories")} ·{" "}
          {briefingReadTime(items.length)}
        </p>
      </header>
      {items.length === 0 ? (
        <p className="meta">Today&apos;s briefing is being prepared.</p>
      ) : (
        <ol className="divide-y divide-rule">
          {items.map((s, i) => (
            <li
              key={s.id}
              className="grid grid-cols-[1rem_65px_1fr] gap-x-2 py-3 first:pt-1"
            >
              <span
                className="font-serif text-[17px] leading-none font-normal text-ink-muted tabular-nums"
                aria-hidden
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <StoryImage
                image={s.leadImage}
                alt={s.title}
                topic={s.topic}
                ratio="1/1"
              />
              <div className="min-w-0">
                <span className="kicker text-forest">{s.topic}</span>
                <h3 className="headline mt-0.5 text-[15px] leading-snug">
                  <Link
                    href={`/story/${s.id}`}
                    className="hover:underline decoration-1 underline-offset-4"
                  >
                    {s.title}
                  </Link>
                </h3>
                <CoverageChip
                  storyId={s.id}
                  stats={s.stats}
                  className="mt-1 flex-wrap text-[10px]"
                />
                <p className="meta mt-1 text-[10px]">{timeAgo(s.updatedAt)}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
      <Link
        href="/explore"
        className="link-quiet mt-3 inline-block text-xs text-forest"
      >
        View all stories →
      </Link>
    </section>
  );
}
