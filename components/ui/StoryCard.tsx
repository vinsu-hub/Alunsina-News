import Link from "next/link";
import type { StorySummary } from "@/lib/types";
import { MetaLine } from "./MetaLine";
import { StatusKicker } from "./Kicker";
import { CoverageBar } from "./CoverageBar";

/**
 * Shared story teaser. Variants:
 *  - "standard": kicker, serif headline, summary, meta, mini coverage bar
 *  - "compact": headline + meta only (lists, search results)
 */
export function StoryCard({
  story,
  variant = "standard",
  showTopic = true,
  className = "",
}: {
  story: StorySummary;
  variant?: "standard" | "compact";
  showTopic?: boolean;
  className?: string;
}) {
  const href = `/story/${story.id}`;
  return (
    <article className={`group ${className}`}>
      <div className="mb-1 flex items-center gap-3">
        {showTopic && <span className="kicker text-forest">{story.topic}</span>}
        <StatusKicker status={story.status} />
      </div>
      <h3 className={`headline leading-snug ${variant === "compact" ? "text-lg" : "text-xl md:text-[22px]"}`}>
        <Link href={href} className="group-hover:underline decoration-1 underline-offset-4">
          {story.title}
        </Link>
      </h3>
      {variant === "standard" && story.summary && (
        <p className="mt-2 line-clamp-3 font-serif text-[15px] leading-relaxed text-ink-soft">{story.summary}</p>
      )}
      <MetaLine stats={story.stats} updatedAt={story.updatedAt} className="mt-2" />
      {variant === "standard" && <CoverageBar byType={story.stats.byType} showLegend={false} height={4} className="mt-2" />}
    </article>
  );
}
