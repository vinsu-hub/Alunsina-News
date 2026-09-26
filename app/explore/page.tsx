import type { Metadata } from "next";
import Link from "next/link";
import { SectionHead } from "@/components/ui";
import { CONTAINER, PageHeader } from "@/components/explore/PageHeader";
import { ExploreSubNav } from "@/components/explore/ExploreSubNav";
import { IndexEntry } from "@/components/explore/IndexEntry";
import { PlaceIndex } from "@/components/explore/PlaceIndex";
import { BlindspotEntry } from "@/components/explore/BlindspotEntry";
import { listBlindspots } from "@/lib/queries";
import { languageCounts, placeStoryCounts, sourceTypeCounts, topicIndex, trendingSubjects } from "@/lib/queries/explore";
import { SOURCE_TYPES, SOURCE_TYPE_COLORS } from "@/lib/taxonomy";
import { plural } from "@/lib/format";

export const metadata: Metadata = {
  title: "Explore",
  description: "Discover stories beyond the headlines: browse by topic, region, source type, and language.",
};

export default async function ExplorePage() {
  const topics = await topicIndex();
  const places = await placeStoryCounts();
  const typeCounts = await sourceTypeCounts();
  const langs = await languageCounts();
  const trending = await trendingSubjects();
  const blindspots = (await listBlindspots({ limit: 50 }))
    .sort((a, b) => b.detectedAt.localeCompare(a.detectedAt))
    .slice(0, 4);

  return (
    <>
      <div className={CONTAINER}>
        <PageHeader title="EXPLORE" dek="Discover stories beyond the headlines." />
      </div>
      <ExploreSubNav />

      <div className={`${CONTAINER} space-y-12 pt-8`}>
        <div className="grid gap-x-10 gap-y-12 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          {/* Topic index */}
          <section aria-labelledby="topics">
            <SectionHead
              id="topics"
              title="Topic Index"
              sub="Every topic we track, with the number of stories filed under it."
              action={<Link href="/topics" className="link-quiet">All topics →</Link>}
            />
            <ul className="columns-1 gap-x-8 sm:columns-2 xl:columns-3">
              {topics.map((t) => (
                <li key={t.slug} className="break-inside-avoid">
                  <IndexEntry href={`/topics/${t.slug}`} label={t.topic} count={t.stories} countLabel="stories" />
                </li>
              ))}
            </ul>
          </section>

          {/* Trending */}
          <section aria-labelledby="trending">
            <SectionHead id="trending" title="Trending Topics" sub="Tracked subjects, ranked by article volume in this edition." />
            <ol>
              {trending.map((t, i) => (
                <li key={t.query} className="border-t border-rule first:border-t-0">
                  <Link href={`/search?q=${encodeURIComponent(t.query)}`} className="group flex items-baseline gap-4 py-2">
                    <span className="w-10 shrink-0 font-serif text-4xl font-semibold leading-none text-ochre tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 flex-1 headline text-xl leading-tight decoration-1 underline-offset-4 group-hover:underline">
                      {t.label}
                    </span>
                    <span className="meta shrink-0 text-right">{plural(t.articles, "article")}<br />{plural(t.stories, "story", "stories")}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        </div>

        {/* Regions */}
        <section aria-labelledby="regions">
          <SectionHead
            id="regions"
            title="Regions"
            sub="From the national picture down to each of the country's regions."
            action={<Link href="/regions" className="link-quiet">Regions index →</Link>}
          />
          <PlaceIndex counts={places} />
        </section>

        <div className="grid gap-x-10 gap-y-12 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          {/* Sources by type */}
          <section aria-labelledby="sources">
            <SectionHead
              id="sources"
              title="Sources"
              sub="Browse by all eight source types. Types describe what a source is, not what it believes."
              action={<Link href="/methodology#source-types" className="link-quiet">How types are assigned</Link>}
            />
            <ul className="grid gap-x-8 sm:grid-cols-2">
              {SOURCE_TYPES.map((t) => (
                <li key={t.id} className="border-t border-rule py-3">
                  <Link href={`/sources?type=${t.id}`} className="group block">
                    <span className="flex items-baseline gap-2">
                      <span className="size-2.5 shrink-0 translate-y-[-1px]" style={{ background: SOURCE_TYPE_COLORS[t.id] }} aria-hidden />
                      <span className="headline text-lg font-semibold decoration-1 underline-offset-4 group-hover:underline">
                        {t.label}
                      </span>
                      <span className="meta ml-auto shrink-0">{plural(typeCounts[t.id], "source")}</span>
                    </span>
                    <span className="mt-1 block font-sans text-[13px] leading-relaxed text-ink-soft">{t.description}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/* Languages */}
          <section aria-labelledby="languages">
            <SectionHead
              id="languages"
              title="Languages"
              sub="Reporting in English, Filipino, and the regional languages."
              action={<Link href="/languages" className="link-quiet">All languages →</Link>}
            />
            <ul>
              {langs.map((l) => (
                <li key={l.id}>
                  <IndexEntry href={`/languages/${l.id}`} label={l.label} count={l.articles} countLabel="articles" />
                </li>
              ))}
            </ul>
            <p className="meta mt-2">Counts are articles in each language.</p>
          </section>
        </div>

        {/* Blindspots (§24: mobile users reach blindspots here) */}
        <section aria-labelledby="blindspots">
          <SectionHead
            id="blindspots"
            title="Potential Blindspots"
            sub="Where coverage looks thin, and why we think so."
            action={<Link href="/blindspots" className="link-quiet">All potential blindspots →</Link>}
          />
          {blindspots.length ? (
            <div className="grid gap-x-8 gap-y-6 md:grid-cols-2 xl:grid-cols-4">
              {blindspots.map((b) => (
                <BlindspotEntry key={b.id} b={b} compact />
              ))}
            </div>
          ) : (
            <p className="font-serif italic text-ink-muted">No potential blindspots flagged right now.</p>
          )}
        </section>
      </div>
    </>
  );
}
