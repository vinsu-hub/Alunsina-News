import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SectionHead } from "@/components/ui";
import { CONTAINER, PageHeader } from "@/components/explore/PageHeader";
import { ExploreSubNav } from "@/components/explore/ExploreSubNav";
import { StoryList } from "@/components/explore/StoryList";
import { IndexEntry } from "@/components/explore/IndexEntry";
import { listStories } from "@/lib/queries";
import { languageCounts } from "@/lib/queries/explore";
import { LANGUAGES, type LanguageId } from "@/lib/taxonomy";
import { plural } from "@/lib/format";

const find = (id: string) => LANGUAGES.find((l) => l.id === id);

export async function generateMetadata({ params }: PageProps<"/languages/[id]">): Promise<Metadata> {
  const { id } = await params;
  const l = find(id);
  return { title: l ? `${l.label} coverage` : "Language not found" };
}

export default async function LanguagePage({ params }: PageProps<"/languages/[id]">) {
  const { id } = await params;
  const lang = find(id);
  if (!lang) notFound();
  const stories = listStories({ language: lang.id as LanguageId, limit: 40 });
  const counts = languageCounts();
  const mine = counts.find((c) => c.id === lang.id)!;

  return (
    <>
      <div className={CONTAINER}>
        <PageHeader
          kicker={<Link href="/languages" className="link-quiet">Languages</Link>}
          title={lang.label}
          dek={`Stories with at least one article in ${lang.label}.`}
          aside={`${plural(mine.articles, "article")} · ${plural(stories.length, "story", "stories")}`}
        />
      </div>
      <ExploreSubNav active="languages" />
      <div className={`${CONTAINER} grid gap-x-10 gap-y-10 pt-8 lg:grid-cols-[minmax(0,1fr)_16rem]`}>
        <section aria-label={`Stories in ${lang.label}`} className="min-w-0">
          <StoryList
            stories={stories}
            columns={2}
            empty={`No ${lang.label} articles in this edition yet. Regional-language gaps are one of the potential blindspots we track.`}
          />
        </section>
        <aside>
          <SectionHead title="Other languages" />
          <ul>
            {counts
              .filter((c) => c.id !== lang.id)
              .map((c) => (
                <li key={c.id}>
                  <IndexEntry href={`/languages/${c.id}`} label={c.label} count={c.articles} countLabel="articles" />
                </li>
              ))}
          </ul>
        </aside>
      </div>
    </>
  );
}
