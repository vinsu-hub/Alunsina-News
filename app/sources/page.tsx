import type { Metadata } from "next";
import Link from "next/link";
import { SectionHead } from "@/components/ui";
import { CONTAINER, PageHeader } from "@/components/explore/PageHeader";
import { ExploreSubNav } from "@/components/explore/ExploreSubNav";
import { SourceRow } from "@/components/explore/SourceRow";
import { listSources } from "@/lib/queries";
import { SOURCE_TYPES, SOURCE_TYPE_COLORS, type SourceTypeId } from "@/lib/taxonomy";
import { plural } from "@/lib/format";

export const metadata: Metadata = {
  title: "Sources",
  description: "Every publisher and agency ALUNSINA NEWS reads, grouped by the eight source types.",
};

export default async function SourcesPage({ searchParams }: PageProps<"/sources">) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.type) ? sp.type[0] : sp.type;
  const active = SOURCE_TYPES.find((t) => t.id === raw)?.id as SourceTypeId | undefined;
  const sources = await listSources();
  const groups = SOURCE_TYPES.filter((t) => !active || t.id === active).map((t) => ({
    ...t,
    sources: sources.filter((s) => s.type === t.id),
  }));
  const countFor = (id: SourceTypeId) => sources.filter((s) => s.type === id).length;

  return (
    <>
      <div className={CONTAINER}>
        <PageHeader
          kicker="Explore"
          title="Sources"
          dek="Every publisher and agency we read, grouped by what kind of source it is."
          aside={
            <Link href="/methodology#source-types" className="link-quiet">
              How source types are assigned →
            </Link>
          }
        />
      </div>
      <ExploreSubNav active="sources" />
      <div className={`${CONTAINER} pt-6`}>
        <nav aria-label="Filter by source type" className="no-scrollbar -mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
          <ul className="flex gap-2 pb-1 md:flex-wrap">
            <li className="shrink-0">
              <Link
                href="/sources"
                aria-current={!active ? "page" : undefined}
                className={`block border px-2.5 py-1 font-sans text-xs font-medium ${
                  !active ? "border-forest bg-forest text-paper" : "border-rule text-ink-soft hover:border-ink"
                }`}
              >
                All types · {sources.length}
              </Link>
            </li>
            {SOURCE_TYPES.map((t) => (
              <li key={t.id} className="shrink-0">
                <Link
                  href={`/sources?type=${t.id}`}
                  aria-current={active === t.id ? "page" : undefined}
                  className={`flex items-center gap-1.5 border px-2.5 py-1 font-sans text-xs font-medium ${
                    active === t.id ? "border-forest bg-forest text-paper" : "border-rule text-ink-soft hover:border-ink"
                  }`}
                >
                  <span className="size-2" style={{ background: SOURCE_TYPE_COLORS[t.id] }} aria-hidden />
                  {t.label} · {countFor(t.id)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-8 space-y-12">
          {groups.map((g) => (
            <section key={g.id} aria-labelledby={`type-${g.id}`}>
              <SectionHead
                id={`type-${g.id}`}
                title={g.label}
                sub={g.description}
                action={plural(g.sources.length, "source")}
              />
              <div className="meta hidden grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,1.4fr)_5.5rem] gap-x-6 pb-1 md:grid">
                <span>Source</span>
                <span>Ownership / affiliation</span>
                <span>Data status · regions · languages</span>
                <span className="text-right">Articles</span>
              </div>
              {g.sources.length ? (
                <ul>
                  {g.sources.map((s) => (
                    <SourceRow key={s.id} s={s} />
                  ))}
                </ul>
              ) : (
                <p className="border-t border-rule py-3 font-serif italic text-ink-muted">
                  No {g.label.toLowerCase()} sources are active yet.
                </p>
              )}
            </section>
          ))}
        </div>
        <p className="meta mt-10 border-t border-rule pt-3">
          Source types describe what a source is, never what it believes. Ownership is stated factually with where the
          information came from. Think something is miscategorized?{" "}
          <Link href="/methodology#corrections" className="link-quiet">Tell us</Link>.
        </p>
      </div>
    </>
  );
}
