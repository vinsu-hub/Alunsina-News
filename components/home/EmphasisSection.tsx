import Link from "next/link";
import { CoverageBar, SourceTypeBadge, ReadOnPublisher } from "@/components/ui";
import { StoryImage } from "@/components/ui/StoryImage";
import { CoverageChip } from "@/components/ui/CoverageChip";
import type { StoryDetail } from "@/lib/types";
import { timeAgo } from "@/lib/format";
export function EmphasisSection({ story }: { story: StoryDetail }) {
  const types = [...new Set(story.articles.map((a) => a.source.type))];
  const preferred = ["government", "independent", "regional", "community"];
  types.sort(
    (a, b) =>
      (preferred.indexOf(a) < 0 ? 9 : preferred.indexOf(a)) -
      (preferred.indexOf(b) < 0 ? 9 : preferred.indexOf(b)),
  );
  const shown = types.slice(0, 4);
  if (types.includes("social") && !shown.includes("social"))
    shown[shown.length - 1] = "social";
  return (
    <section
      aria-labelledby="emphasis-title"
      className="mt-5 border-t border-rule pt-3"
    >
      <h2 id="emphasis-title" className="font-serif text-[18px] uppercase">
        What Sources Are Emphasizing
      </h2>
      <p className="meta mt-1">
        On:{" "}
        <Link href={`/story/${story.id}`} className="link-quiet">
          &ldquo;{story.title}&rdquo; →
        </Link>
      </p>
      <CoverageBar byType={story.stats.byType} height={5} className="mt-3" />
      <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto lg:grid lg:grid-cols-4">
        {shown.map((t) => {
          const a = story.articles.find((a) => a.source.type === t)!;
          return (
            <article
              key={t}
              className="min-w-0 w-[220px] shrink-0 border-r border-rule pr-3 lg:w-auto"
            >
              <h3 className="mb-2">
                <SourceTypeBadge type={t} short />
              </h3>
              <StoryImage
                image={
                  a.imageUrl
                    ? {
                        url: a.imageUrl,
                        credit: a.imageCredit ?? a.source.name,
                      }
                    : null
                }
                alt={a.headline}
                topic={story.topic}
                ratio="4/3"
              />
              <p className="headline mt-2 text-[15px] leading-snug">
                {a.headline}
              </p>
              <p className="mt-2 line-clamp-2 font-serif text-[13px] text-ink-soft">
                {a.excerpt ||
                  story.emphasis.find((e) => e.sourceType === t)?.points[0]}
              </p>
              {t === "social" && (
                <p className="mt-2 text-[11px] text-terracotta">
                  Circulating online; not independently reported.
                </p>
              )}
              <CoverageChip
                storyId={story.id}
                stats={story.stats}
                className="mt-2 flex-wrap text-[9px]"
              />
              <p className="meta mt-1 text-[10px]">{timeAgo(a.publishedAt)}</p>
              {t !== "social" && (
                <ReadOnPublisher
                  url={a.url}
                  source={a.source}
                  className="mt-2 text-[10px]"
                />
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
