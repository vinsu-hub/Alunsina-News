import Link from "next/link";
import { StoryImage } from "@/components/ui/StoryImage";
import { CoverageChip } from "@/components/ui/CoverageChip";
import type { StoryDetail } from "@/lib/types";
import { timeAgo } from "@/lib/format";
export function LeadStory({ story }: { story: StoryDetail }) {
  return (
    <article aria-labelledby="lead-title">
      <div className="relative">
        <StoryImage
          image={story.leadImage}
          alt={story.title}
          topic={story.topic}
          priority
        />
        {story.status === "developing" && (
          <span className="absolute left-3 top-3 bg-terracotta px-3 py-1 text-[10px] font-semibold uppercase text-paper">
            Developing
          </span>
        )}
      </div>
      <p className="kicker mt-2 text-forest">{story.topic}</p>
      <h2
        id="lead-title"
        className="headline mt-1 text-[34px] font-semibold leading-[1.04] md:text-[42px]"
      >
        <Link href={`/story/${story.id}`}>{story.title}</Link>
      </h2>
      <p className="mt-3 font-serif text-[18px] leading-snug text-ink-soft">
        {story.summary}
      </p>
      <CoverageChip
        storyId={story.id}
        stats={story.stats}
        variant="full"
        className="mt-3 flex-wrap text-[10px]"
      />
      <p className="meta mt-2 text-[10px]">
        Updated{" "}
        <time dateTime={story.updatedAt}>{timeAgo(story.updatedAt)}</time>
      </p>
    </article>
  );
}
