import Link from "next/link";
import { CoverageBar, ReadOnPublisher, SaveButton, SourceTypeBadge, StatusKicker } from "@/components/ui";
import type { StoryDetail } from "@/lib/types";
import { timeAgo } from "@/lib/format";

/** §15: the dominant element of the front page. */
export function LeadStory({ story }: { story: StoryDetail }) {
  const href = `/story/${story.id}`;
  // Latest editorial reporting; social posts are not "sources" to read on.
  const latest = story.articles.filter((a) => a.source.type !== "social").slice(0, 3);
  const stats = [
    { n: story.stats.sources, label: story.stats.sources === 1 ? "Source" : "Sources" },
    { n: story.stats.regions, label: story.stats.regions === 1 ? "Region" : "Regions" },
    { n: story.stats.languages, label: story.stats.languages === 1 ? "Language" : "Languages" },
  ];
  return (
    <article aria-labelledby="lead-title">
      <div className="flex items-center gap-3 border-t-[3px] border-ink pt-3">
        <StatusKicker status={story.status} />
        <span className="kicker text-forest">{story.topic}</span>
      </div>
      <h2 id="lead-title" className="headline mt-2 text-[36px] leading-[1.06] font-semibold md:text-[44px] lg:text-[48px]">
        <Link href={href} className="hover:underline decoration-2 underline-offset-[6px]">
          {story.title}
        </Link>
      </h2>
      <p className="mt-4 font-serif text-lg leading-relaxed text-ink-soft md:text-[19px]">{story.summary}</p>

      <dl className="mt-5 grid grid-cols-4 border-y border-rule">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col-reverse justify-end gap-1 border-r border-rule px-2 py-2.5 first:pl-0">
            <dt className="meta">{s.label}</dt>
            <dd className="font-serif text-2xl leading-none text-ink tabular-nums">{s.n}</dd>
          </div>
        ))}
        <div className="flex flex-col-reverse justify-end gap-1 px-2 py-2.5">
          <dt className="meta">Updated</dt>
          <dd className="font-serif text-xl leading-none text-ink md:text-2xl">
            <time dateTime={story.updatedAt}>{timeAgo(story.updatedAt)}</time>
          </dd>
        </div>
      </dl>

      <CoverageBar byType={story.stats.byType} className="mt-4" height={8} />

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
        <Link
          href={href}
          className="inline-flex items-center gap-2 bg-forest px-4 py-2.5 font-sans text-sm font-semibold text-paper hover:bg-forest-dark"
        >
          Explore coverage <span aria-hidden>→</span>
        </Link>
        <Link href={`${href}?compare=1`} className="font-sans text-sm font-semibold text-forest link-quiet">
          Compare coverage
        </Link>
        <SaveButton storyId={story.id} className="ml-auto" />
      </div>

      {latest.length > 0 && (
        <section aria-labelledby="lead-latest" className="mt-7">
          <h3 id="lead-latest" className="kicker border-b border-ink pb-1.5 text-ink">
            Latest from sources
          </h3>
          <ul className="divide-y divide-rule">
            {latest.map((a) => (
              <li key={a.id} className="py-3">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <SourceTypeBadge type={a.source.type} short />
                  <span className="meta">
                    {a.source.name} · <time dateTime={a.publishedAt}>{timeAgo(a.publishedAt)}</time>
                  </span>
                </div>
                <p className="headline mt-1 text-base leading-snug">{a.headline}</p>
                <ReadOnPublisher url={a.url} source={a.source} className="mt-1.5" />
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
