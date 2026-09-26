import type { StoryStats } from "@/lib/types";
import { plural, timeAgo } from "@/lib/format";

/** "18 sources · 7 regions · 3 languages · 2h ago" */
export function MetaLine({
  stats,
  updatedAt,
  className = "",
  updatedLabel = "",
}: {
  stats: StoryStats;
  updatedAt?: string;
  className?: string;
  updatedLabel?: string;
}) {
  const parts = [
    plural(stats.sources, "source"),
    plural(stats.regions, "region"),
    plural(stats.languages, "language"),
  ];
  return (
    <p className={`meta ${className}`}>
      {parts.join(" · ")}
      {updatedAt && (
        <>
          {" · "}
          <time dateTime={updatedAt}>
            {updatedLabel}
            {timeAgo(updatedAt)}
          </time>
        </>
      )}
    </p>
  );
}
