import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CONTAINER, PageHeader } from "@/components/explore/PageHeader";
import { ExploreSubNav } from "@/components/explore/ExploreSubNav";
import { FilterList } from "@/components/explore/FilterList";
import { StoryList } from "@/components/explore/StoryList";
import { listStories } from "@/lib/queries";
import { topicFacets, topicFromSlug } from "@/lib/queries/explore";
import { LANGUAGES, REGIONS, type LanguageId, type RegionId } from "@/lib/taxonomy";
import { plural } from "@/lib/format";

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export async function generateMetadata({ params }: PageProps<"/topics/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const topic = topicFromSlug(slug);
  return { title: topic ?? "Topic not found", description: topic ? `Stories about ${topic}, compared across sources.` : undefined };
}

export default async function TopicPage({ params, searchParams }: PageProps<"/topics/[slug]">) {
  const { slug } = await params;
  const sp = await searchParams;
  const topic = topicFromSlug(slug);
  if (!topic) notFound();

  const regionParam = one(sp.region);
  const langParam = one(sp.language);
  const regionId = REGIONS.find((r) => r.id === regionParam)?.id as RegionId | undefined;
  const langId = LANGUAGES.find((l) => l.id === langParam)?.id as LanguageId | undefined;

  const stories = listStories({ topic, region: regionId, language: langId, limit: 40 });
  const facets = topicFacets(topic);
  const base = `/topics/${slug}`;
  const href = (region?: string, language?: string) => {
    const q = new URLSearchParams();
    if (region) q.set("region", region);
    if (language) q.set("language", language);
    const s = q.toString();
    return s ? `${base}?${s}` : base;
  };
  const filtered = Boolean(regionId || langId);

  return (
    <>
      <div className={CONTAINER}>
        <PageHeader
          kicker={<Link href="/topics" className="link-quiet">Topics</Link>}
          title={topic}
          dek={`${plural(stories.length, "story", "stories")}${filtered ? " matching your filters" : ""}, each compared across sources.`}
        />
      </div>
      <ExploreSubNav active="topics" />
      <div className={`${CONTAINER} grid gap-x-10 gap-y-8 pt-8 lg:grid-cols-[minmax(0,1fr)_16rem]`}>
        <section aria-label={`${topic} stories`} className="min-w-0">
          {filtered && (
            <p className="meta mb-3">
              Filtered by {[regionId && REGIONS.find((r) => r.id === regionId)!.label, langId && LANGUAGES.find((l) => l.id === langId)!.label]
                .filter(Boolean)
                .join(" · ")}{" "}
              · <Link href={base} className="link-quiet">Clear filters</Link>
            </p>
          )}
          <StoryList stories={stories} columns={2} empty={`No ${topic} stories match these filters.`} />
        </section>
        <aside className="space-y-6 lg:order-none">
          <FilterList
            title="Region"
            items={[
              { href: href(undefined, langId), label: "All regions", active: !regionId },
              ...REGIONS.filter((r) => facets.regions.has(r.id) || r.id === regionId).map((r) => ({
                href: href(r.id, langId),
                label: r.label,
                count: facets.regions.get(r.id) ?? 0,
                active: r.id === regionId,
              })),
            ]}
          />
          <FilterList
            title="Language"
            items={[
              { href: href(regionId, undefined), label: "All languages", active: !langId },
              ...LANGUAGES.filter((l) => facets.languages.has(l.id) || l.id === langId).map((l) => ({
                href: href(regionId, l.id),
                label: l.label,
                count: facets.languages.get(l.id) ?? 0,
                active: l.id === langId,
              })),
            ]}
          />
          <p className="meta">Counts are stories in this topic with at least one article from that region or language.</p>
        </aside>
      </div>
    </>
  );
}
