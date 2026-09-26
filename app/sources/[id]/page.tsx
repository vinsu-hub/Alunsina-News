import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SectionHead, SourceTypeBadge, SubscriptionTag } from "@/components/ui";
import { CONTAINER } from "@/components/explore/PageHeader";
import { ExploreSubNav } from "@/components/explore/ExploreSubNav";
import { StoryList } from "@/components/explore/StoryList";
import { ArticleItem } from "@/components/explore/ArticleItem";
import { getSource } from "@/lib/queries";
import { evidenceForSource } from "@/lib/queries/explore";
import { DATA_STATUSES, dataStatus, language, region, sourceType, topicSlug } from "@/lib/taxonomy";
import { pct, plural, timeAgo } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/sources/[id]">): Promise<Metadata> {
  const { id } = await params;
  const s = getSource(id);
  return s
    ? { title: s.name, description: `${s.name}: ${sourceType(s.type).label}. Ownership, data status, and coverage.` }
    : { title: "Source not found" };
}

const DATA_STATUS_EXPLAINED: Record<string, string> = {
  partner:
    "This publisher shares data with ALUNSINA NEWS directly under an agreement. We still show only headlines and short excerpts; full reporting stays on their site.",
  feed: "We read this publisher's public RSS feed: headline, a short excerpt, and a link. Full articles stay on their site.",
  link: "We show the headline and an outbound link only, with no excerpt.",
};

export default async function SourceProfilePage({ params }: PageProps<"/sources/[id]">) {
  const { id } = await params;
  const s = getSource(id);
  if (!s) notFound();
  const t = sourceType(s.type);
  const status = dataStatus(s.dataStatus);
  const evidence = evidenceForSource(s.id);
  const isPrimary = s.type === "primary" || s.type === "government";
  const maxShare = Math.max(...s.coverage.map((c) => c.share), 0.01);

  return (
    <>
      <div className={CONTAINER}>
        <header className="border-b border-ink pb-5 pt-8 md:pt-10">
          <p className="kicker mb-2 flex flex-wrap gap-x-2 text-forest">
            <Link href="/sources" className="link-quiet">Sources</Link>
            <span aria-hidden>/</span>
            <Link href={`/sources?type=${s.type}`} className="link-quiet">{t.label}</Link>
          </p>
          <h1 className="headline break-words text-4xl font-semibold leading-[1.05] md:text-6xl">{s.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            <SourceTypeBadge type={s.type} />
            <span className="meta">
              {plural(s.articleCount, "article")} · {plural(s.storyCount, "story", "stories")}
            </span>
            {s.paywalled && <SubscriptionTag />}
            <a
              href={s.homepage}
              target="_blank"
              rel="noopener noreferrer"
              className="font-sans text-xs font-semibold text-forest underline decoration-forest/30 underline-offset-4 hover:decoration-forest"
            >
              Visit publisher <span aria-hidden>↗</span>
            </a>
          </div>
        </header>
      </div>
      <ExploreSubNav active="sources" />

      <div className={`${CONTAINER} grid gap-x-10 gap-y-12 pt-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]`}>
        {/* Fact sheet */}
        <aside className="min-w-0 space-y-8">
          <section aria-labelledby="facts">
            <SectionHead id="facts" title="Source profile" />
            <dl className="divide-y divide-rule border-b border-rule font-sans text-sm">
              <div className="py-3">
                <dt className="kicker text-ink-muted">Source type</dt>
                <dd className="mt-1 font-semibold text-ink">{t.label}</dd>
                <dd className="mt-0.5 text-[13px] leading-relaxed text-ink-soft">{t.description}</dd>
                <dd className="mt-1 text-[13px]">
                  <Link href="/methodology#source-types" className="link-quiet text-ink-muted">How types are assigned</Link>
                </dd>
              </div>
              <div className="py-3">
                <dt className="kicker text-ink-muted">Ownership / affiliation</dt>
                <dd className="mt-1 text-ink">{s.ownership}</dd>
                <dd className="meta mt-1">
                  Source of this information: {s.ownershipSource ?? "Not yet documented; under editorial review."}
                </dd>
              </div>
              <div className="py-3">
                <dt className="kicker text-ink-muted">Data status</dt>
                <dd className="mt-1 flex flex-wrap items-center gap-2 font-semibold text-ink">
                  {status.label}
                  {s.paywalled && <SubscriptionTag />}
                </dd>
                <dd className="mt-0.5 text-[13px] leading-relaxed text-ink-soft">{DATA_STATUS_EXPLAINED[s.dataStatus]}</dd>
                <dd className="meta mt-1">
                  Statuses: {DATA_STATUSES.map((d) => d.label).join(" · ")}.{" "}
                  <Link href="/methodology#linking" className="link-quiet">What these mean</Link>
                </dd>
              </div>
              <div className="py-3">
                <dt className="kicker text-ink-muted">Based in</dt>
                <dd className="mt-1 text-ink">
                  {s.regions.length
                    ? s.regions.map((r, i) => (
                        <span key={r}>
                          {i > 0 && ", "}
                          <Link href={`/regions/${r}`} className="link-quiet">{region(r).label}</Link>
                        </span>
                      ))
                    : "No fixed region"}
                </dd>
              </div>
              <div className="py-3">
                <dt className="kicker text-ink-muted">Languages</dt>
                <dd className="mt-1 text-ink">
                  {s.languages.map((l, i) => (
                    <span key={l}>
                      {i > 0 && ", "}
                      <Link href={`/languages/${l}`} className="link-quiet">{language(l).label}</Link>
                    </span>
                  ))}
                </dd>
              </div>
              {s.topics.length > 0 && (
                <div className="py-3">
                  <dt className="kicker text-ink-muted">Topics</dt>
                  <dd className="mt-1 text-ink">
                    {s.topics.map((tp, i) => (
                      <span key={tp}>
                        {i > 0 && ", "}
                        <Link href={`/topics/${topicSlug(tp)}`} className="link-quiet">{tp}</Link>
                      </span>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
            <p className="meta mt-3">
              We describe sources by what they are, never by a political score.{" "}
              <Link href="/methodology#corrections" className="link-quiet">Report a miscategorization</Link>
            </p>
          </section>

          <section aria-labelledby="footprint">
            <SectionHead id="footprint" title="Coverage footprint" sub="Where this source's articles are about or from." />
            {s.coverage.length ? (
              <dl className="space-y-2">
                {s.coverage.map((c) => (
                  <div key={c.regionId}>
                    <div className="flex items-baseline justify-between gap-3 font-sans text-[13px]">
                      <dt>
                        <Link href={`/regions/${c.regionId}`} className="link-quiet text-ink">{region(c.regionId).label}</Link>
                      </dt>
                      <dd className="meta">
                        {c.articles} · {pct(c.share)}
                      </dd>
                    </div>
                    <span className="mt-1 block h-1 bg-rule/50" aria-hidden>
                      <span className="block h-full bg-ochre" style={{ width: `${Math.max(1, (c.share / maxShare) * 100)}%` }} />
                    </span>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="font-serif italic text-ink-muted">No region-tagged articles yet.</p>
            )}
          </section>

          {(isPrimary || evidence.length > 0) && (
            <section aria-labelledby="primary">
              <SectionHead
                id="primary"
                title="Primary-source links"
                sub={isPrimary ? "Documents and statements issued by this source." : "Evidence linked to stories this source covered."}
              />
              <ul>
                {isPrimary &&
                  s.recentArticles.slice(0, 6).map((a) => (
                    <li key={a.id} className="border-t border-rule py-2">
                      <a href={a.url} target="_blank" rel="noopener noreferrer" className="font-serif text-[15px] leading-snug text-ink hover:underline">
                        {a.headline} <span aria-hidden className="text-ink-muted">↗</span>
                      </a>
                      <p className="meta">{timeAgo(a.publishedAt)}</p>
                    </li>
                  ))}
                {evidence.map((e) => (
                  <li key={e.url} className="border-t border-rule py-2">
                    <a href={e.url} target="_blank" rel="noopener noreferrer" className="font-serif text-[15px] leading-snug text-ink hover:underline">
                      {e.title} <span aria-hidden className="text-ink-muted">↗</span>
                    </a>
                    <p className="meta">
                      <span className="capitalize">{e.kind}</span> · {e.publisher}
                      {e.publishedAt && ` · ${timeAgo(e.publishedAt)}`}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>

        <div className="min-w-0 space-y-12">
          <section aria-labelledby="stories">
            <SectionHead id="stories" title="Stories covered" sub="Stories this source has contributed to, compared across sources." />
            <StoryList stories={s.stories} columns={2} empty="This source hasn't been grouped into a story yet." />
          </section>
          <section aria-labelledby="recent">
            <SectionHead id="recent" title="Recent articles" />
            {s.recentArticles.length ? (
              <div className="grid gap-x-8 md:grid-cols-2">
                {s.recentArticles.slice(0, 12).map((a) => (
                  <ArticleItem key={a.id} a={a} showSource={false} />
                ))}
              </div>
            ) : (
              <p className="font-serif italic text-ink-muted">No articles yet.</p>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
