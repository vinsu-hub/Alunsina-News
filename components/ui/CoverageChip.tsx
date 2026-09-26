import Link from "next/link";
import type { StoryStats } from "@/lib/types";
import { plural } from "@/lib/format";

/**
 * The shared Coverage Chip (Master spec §1): "12 sources · view coverage".
 * Attached wherever a single story/headline appears; always opens that Story.
 *  - "compact": "12 sources · view coverage"
 *  - "full":    "18 sources · 7 regions · 4 languages · view coverage"
 */
export function CoverageChip({
  storyId,
  stats,
  variant = "compact",
  className = "",
}: {
  storyId: string;
  stats: Pick<StoryStats, "sources"> & Partial<Pick<StoryStats, "regions" | "languages">>;
  variant?: "compact" | "full";
  className?: string;
}) {
  const parts = [plural(stats.sources, "source")];
  if (variant === "full") {
    if (stats.regions != null) parts.push(plural(stats.regions, "region"));
    if (stats.languages != null) parts.push(plural(stats.languages, "language"));
  }
  return (
    <Link
      href={`/story/${storyId}#coverage`}
      className={`group/chip inline-flex items-center gap-1.5 font-sans text-xs tabular-nums text-ink-muted hover:text-ink ${className}`}
      aria-label={`${parts.join(", ")}. View coverage`}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <path d="M5 4h10l4 4v12H5z M9 12h6 M9 16h6" />
      </svg>
      <span>{parts.join(" · ")}</span>
      <span aria-hidden className="text-rule">·</span>
      <span className="text-forest underline decoration-forest/30 underline-offset-2 group-hover/chip:decoration-forest">view coverage</span>
    </Link>
  );
}
