import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SectionHead, SourceTypeBadge } from "@/components/ui";
import { CONTAINER, PageHeader } from "@/components/explore/PageHeader";
import { ExploreSubNav } from "@/components/explore/ExploreSubNav";
import { StoryList } from "@/components/explore/StoryList";
import { ArticleItem } from "@/components/explore/ArticleItem";
import { IndexEntry } from "@/components/explore/IndexEntry";
import { RegionComparisonBlock } from "@/components/explore/RegionComparisonBlock";
import { listSources, listStories } from "@/lib/queries";
import {
  getPlace,
  localReporting,
  placeStoryCounts,
  regionComparison,
  sourcesInRegions,
} from "@/lib/queries/explore";
import { ISLAND_GROUPS, REGIONS } from "@/lib/taxonomy";
import { plural } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/regions/[id]">): Promise<Metadata> {
  const { id } = await params;
  const place = getPlace(id);
  if (!place) return { title: "Region not found" };
  return {
    title: place.kind === "region" ? `${place.label} (${place.name})` : place.label,
    description: `Stories, sources, and local reporting from ${place.label}.`,
  };
}

export default async function RegionPage({ params }: PageProps<"/regions/[id]">) {
  const { id } = await params;
  const place = getPlace(id);
  if (!place) notFound();

  const national = place.kind === "national";
  const stories = national
    ? listStories({ sourceType: "national", limit: 24 })
    : place.kind === "island"
      ? listStories({ island: place.id, limit: 24 })
      : listStories({ region: place.regionIds[0], limit: 24 });
  const sources = national ? listSources({ type: "national" }) : sourcesInRegions(place.regionIds);
  const local = national ? [] : localReporting(place.regionIds);
  const comparison = national ? null : regionComparison(place.regionIds);
  const counts = placeStoryCounts();
  const island = place.island ? ISLAND_GROUPS.find((g) => g.id === place.island)! : null;
  const subRegions = place.kind === "island" ? REGIONS.filter((r) => r.island === place.id) : [];

  const kicker = (
    <span className="flex flex-wrap gap-x-2">
      <Link href="/regions" className="link-quiet">Regions</Link>
      {place.kind === "region" && island && (
        <>
          <span aria-hidden>/</span>
          <Link href={`/regions/${island.id}`} className="link-quiet">{island.label}</Link>
        </>
      )}
    </span>
  );

  return (
    <>
      <div className={CONTAINER}>
        <PageHeader
          kicker={kicker}
          title={place.label}
          dek={
            national
              ? "Stories carried by national media, and how the rest of the country fits in."
              : place.kind === "island"
                ? `Stories touching the regions of ${place.label}.`
                : place.name !== place.label
                  ? place.name
                  : undefined
          }
          aside={plural(stories.length, "story", "stories")}
        />
      </div>
      <ExploreSubNav active="regions" />

      <div className={`${CONTAINER} grid gap-x-10 gap-y-12 pt-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]`}>
        <div className="min-w-0 space-y-12">
          {/* INTEGRATION SLOT: shared <PhilippineCoverage /> map goes here, focused on this place
              (initialIsland = place.island, highlighted regions = place.regionIds). */}

          <section aria-labelledby="stories">
            <SectionHead id="stories" title={national ? "National stories" : `Stories touching ${place.label}`} />
            <StoryList stories={stories} columns={2} empty={`No stories tagged to ${place.label} in this edition.`} />
          </section>

          {!national && (
            <section aria-labelledby="local">
              <SectionHead
                id="local"
                title="Local reporting"
                sub={`From regional and community outlets based in ${place.label}.`}
              />
              {local.length ? (
                <div className="grid gap-x-8 md:grid-cols-2">
                  {local.map((a) => (
                    <ArticleItem key={a.id} a={a} />
                  ))}
                </div>
              ) : (
                <p className="border-t border-rule py-4 font-serif italic text-ink-muted">
                  We don&rsquo;t yet carry a regional or community outlet from {place.label}.{" "}
                  <Link href="/methodology#corrections" className="link-quiet not-italic">Suggest one</Link>.
                </p>
              )}
            </section>
          )}
        </div>

        <aside className="min-w-0 space-y-10">
          {comparison && (
            <section aria-labelledby="compare">
              <SectionHead id="compare" title="Compared with national average" />
              <RegionComparisonBlock c={comparison} label={place.label} />
            </section>
          )}

          {subRegions.length > 0 && (
            <section aria-labelledby="subregions">
              <SectionHead id="subregions" title={`Regions of ${place.label}`} />
              <ul>
                {subRegions.map((r) => (
                  <li key={r.id}>
                    <IndexEntry href={`/regions/${r.id}`} label={r.label} sub={r.name} count={counts.region(r.id)} countLabel="stories" />
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="sources">
            <SectionHead
              id="sources"
              title={national ? "National sources" : `Sources based in ${place.label}`}
              action={<Link href="/sources" className="link-quiet">All sources →</Link>}
            />
            {sources.length ? (
              <ul>
                {sources.map((s) => (
                  <li key={s.id} className="border-t border-rule py-2">
                    <Link href={`/sources/${s.id}`} className="headline text-[17px] font-semibold hover:underline">
                      {s.name}
                    </Link>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-3">
                      <SourceTypeBadge type={s.type} short />
                      <span className="meta">{plural(s.articleCount, "article")}</span>
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="font-serif italic text-ink-muted">No sources based here yet.</p>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}
