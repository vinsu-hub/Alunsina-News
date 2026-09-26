import type { Metadata } from "next";
import { SectionHead } from "@/components/ui";
import { CONTAINER, PageHeader } from "@/components/explore/PageHeader";
import { ExploreSubNav } from "@/components/explore/ExploreSubNav";
import { IndexEntry } from "@/components/explore/IndexEntry";
import { languageCounts } from "@/lib/queries/explore";
import { plural } from "@/lib/format";

export const metadata: Metadata = {
  title: "Languages",
  description: "Philippine news in English, Filipino, and the regional languages.",
};

export default async function LanguagesPage() {
  const langs = await languageCounts();
  return (
    <>
      <div className={CONTAINER}>
        <PageHeader
          kicker="Explore"
          title="Languages"
          dek="The same story often reads differently in Cebuano, Ilocano, or Hiligaynon. Browse reporting by language."
        />
      </div>
      <ExploreSubNav active="languages" />
      <div className={`${CONTAINER} pt-8`}>
        <SectionHead title="Language Index" sub="Article counts across the current edition." />
        <ul className="grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
          {langs.map((l) => (
            <li key={l.id}>
              <IndexEntry
                href={`/languages/${l.id}`}
                label={l.label}
                sub={plural(l.stories, "story", "stories")}
                count={l.articles}
                countLabel="articles"
              />
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
