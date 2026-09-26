import { StoryCard } from "@/components/ui";
import { CoverageChip } from "@/components/ui/CoverageChip";
import { StoryImage } from "@/components/ui/StoryImage";
import type { StorySummary } from "@/lib/types";

/** Ruled list of stories; the first (or first two in 2-col) get the standard card, the rest compact. */
export function StoryList({
  stories,
  empty = "No stories yet.",
  columns = 1,
  variant = "mixed",
}: {
  stories: StorySummary[];
  empty?: string;
  columns?: 1 | 2;
  variant?: "mixed" | "standard" | "compact";
}) {
  if (!stories.length) return <p className="border-t border-rule py-4 font-serif italic text-ink-muted">{empty}</p>;
  const leads = columns === 2 ? 2 : 1;
  return (
    <ul className={columns === 2 ? "grid gap-x-8 md:grid-cols-2" : ""}>
      {stories.map((s, i) => (
        <li key={s.id} className="border-t border-rule py-4">
          <div className="grid grid-cols-[5rem_minmax(0,1fr)] gap-3"><StoryImage image={s.leadImage} alt={s.title} topic={s.topic} ratio="1/1" /><div className="min-w-0"><StoryCard story={s} variant={variant === "mixed" ? (i < leads ? "standard" : "compact") : variant} /><CoverageChip storyId={s.id} stats={s.stats} className="mt-2 flex-wrap" /></div></div>
        </li>
      ))}
    </ul>
  );
}
