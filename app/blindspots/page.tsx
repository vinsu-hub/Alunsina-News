import type { Metadata } from "next";
import Link from "next/link";
import { CONTAINER, PageHeader } from "@/components/explore/PageHeader";
import { ExploreSubNav } from "@/components/explore/ExploreSubNav";
import { BlindspotEntry } from "@/components/explore/BlindspotEntry";
import { listBlindspots } from "@/lib/queries";
import { BLINDSPOT_TYPES, type BlindspotTypeId } from "@/lib/taxonomy";
import { plural } from "@/lib/format";

export const metadata: Metadata = {
  title: "Potential Blindspots",
  description: "Where coverage of a story looks thin, and why each one was flagged.",
};

export default async function BlindspotsPage({ searchParams }: PageProps<"/blindspots">) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.type) ? sp.type[0] : sp.type;
  const active = BLINDSPOT_TYPES.find((t) => t.id === raw)?.id as BlindspotTypeId | undefined;
  const everything = listBlindspots({ limit: 200 });
  const shown = active ? everything.filter((b) => b.type === active) : everything;
  const countFor = (id: BlindspotTypeId) => everything.filter((b) => b.type === id).length;
  const activeType = active ? BLINDSPOT_TYPES.find((t) => t.id === active)! : null;

  return (
    <>
      <div className={CONTAINER}>
        <PageHeader
          kicker="Explore"
          title="Potential Blindspots"
          dek="Places where coverage of a story looks thin: a region, a language, a kind of source, or the evidence itself."
          aside={plural(everything.length, "current flag")}
        />
      </div>
      <ExploreSubNav active="blindspots" />
      <div className={`${CONTAINER} grid gap-x-10 gap-y-8 pt-8 lg:grid-cols-[16rem_minmax(0,1fr)]`}>
        <aside className="min-w-0 space-y-6">
          <p className="font-serif text-[15px] leading-relaxed text-ink-soft">
            We call these <em>potential</em> blindspots because they are signals, not verdicts. Each is raised
            automatically when a story crosses a published threshold, and each shows the reason it was flagged. Coverage
            may exist that we don&rsquo;t yet read.{" "}
            <Link href="/methodology#blindspots" className="link-quiet text-ink">
              See the exact rules
            </Link>
            .
          </p>
          <nav aria-label="Filter by blindspot type">
            <h2 className="kicker border-b border-ink pb-1 text-ink">Type</h2>
            <ul className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-2 lg:mx-0 lg:block lg:px-0 lg:py-0">
              {[{ id: undefined, label: "All types", n: everything.length }, ...BLINDSPOT_TYPES.map((t) => ({ id: t.id, label: t.label, n: countFor(t.id) }))].map(
                (t) => {
                  const on = t.id === active;
                  return (
                    <li key={t.label} className="shrink-0">
                      <Link
                        href={t.id ? `/blindspots?type=${t.id}` : "/blindspots"}
                        aria-current={on ? "page" : undefined}
                        className={`flex items-baseline justify-between gap-3 border px-2.5 py-1 font-sans text-[13px] lg:border-0 lg:border-b lg:border-rule/60 lg:px-0 lg:py-1.5 ${
                          on ? "border-forest font-semibold text-forest-dark" : "border-rule text-ink-soft hover:text-ink"
                        }`}
                      >
                        <span>{t.label}</span>
                        <span className="meta">{t.n}</span>
                      </Link>
                    </li>
                  );
                },
              )}
            </ul>
          </nav>
        </aside>

        <section aria-label="Current potential blindspots" className="min-w-0">
          {activeType && (
            <p className="mb-4 font-sans text-sm text-ink-soft">
              <span className="font-semibold text-ink">{activeType.label}:</span> {activeType.description}
            </p>
          )}
          {shown.length ? (
            <div className="grid gap-x-8 gap-y-8 md:grid-cols-2">
              {shown.map((b) => (
                <BlindspotEntry key={b.id} b={b} />
              ))}
            </div>
          ) : (
            <p className="border-t border-rule py-4 font-serif italic text-ink-muted">
              No potential {activeType ? `${activeType.label.toLowerCase()} ` : ""}blindspots are flagged right now.
            </p>
          )}
        </section>
      </div>
    </>
  );
}
