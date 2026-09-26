import type { Metadata } from "next";
import Link from "next/link";
import { SectionHead } from "@/components/ui";
import { CONTAINER, PageHeader } from "@/components/explore/PageHeader";
import { ExploreSubNav } from "@/components/explore/ExploreSubNav";
import { listStories } from "@/lib/queries";
import { topicIndex } from "@/lib/queries/explore";
import { plural } from "@/lib/format";

export const metadata: Metadata = {
  title: "Topics",
  description: "Every topic ALUNSINA NEWS tracks, with its latest stories.",
};

export default function TopicsPage() {
  const topics = topicIndex();
  return (
    <>
      <div className={CONTAINER}>
        <PageHeader kicker="Explore" title="Topics" dek="Every topic we track, with its most recent stories." />
      </div>
      <ExploreSubNav active="topics" />
      <div className={`${CONTAINER} pt-8`}>
        <SectionHead title="Topic Index" sub={`${topics.length} topics, A to Z`} />
        <ul className="grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {topics.map((t) => {
            const latest = t.stories ? listStories({ topic: t.topic, limit: 2 }) : [];
            return (
              <li key={t.slug} className="border-t border-ink pt-2">
                <Link href={`/topics/${t.slug}`} className="group flex items-baseline justify-between gap-3">
                  <h2 className="headline text-2xl font-semibold decoration-1 underline-offset-4 group-hover:underline">
                    {t.topic}
                  </h2>
                  <span className="meta shrink-0">{plural(t.stories, "story", "stories")}</span>
                </Link>
                {latest.length ? (
                  <ul className="mt-2">
                    {latest.map((s) => (
                      <li key={s.id} className="border-t border-rule py-2">
                        <Link href={`/story/${s.id}`} className="font-serif text-[15px] leading-snug text-ink-soft hover:text-ink hover:underline">
                          {s.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 font-serif text-[15px] italic text-ink-muted">No stories in this edition.</p>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
