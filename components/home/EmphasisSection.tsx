import Link from "next/link";
import { CoverageBar, SourceTypeBadge } from "@/components/ui";
import { SOURCE_TYPE_IDS } from "@/lib/taxonomy";
import type { StoryDetail } from "@/lib/types";

/** §16: always tied to a named story. Descriptive, never "who is right". */
export function EmphasisSection({ story }: { story: StoryDetail }) {
  const byType = new Map(story.emphasis.filter((e) => e.points.length).map((e) => [e.sourceType, e.points]));
  const types = SOURCE_TYPE_IDS.filter((t) => byType.has(t));
  return (
    <section aria-labelledby="emphasis-title">
      <header className="section-head mb-4">
        <h2 id="emphasis-title" className="kicker mt-2 text-ink">
          What Sources Are Emphasizing
        </h2>
        <p className="mt-1 font-serif text-[15px] italic text-ink-soft">
          On:{" "}
          <Link href={`/story/${story.id}`} className="link-quiet not-italic text-ink">
            &ldquo;{story.title}&rdquo;
          </Link>
        </p>
      </header>

      <CoverageBar byType={story.stats.byType} height={12} />

      {types.length === 0 ? (
        <p className="meta mt-4">Emphasis notes for this story are still being compiled.</p>
      ) : (
        <div className="mt-5 grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(170px,1fr))]">
          {types.map((t) => {
            const social = t === "social";
            return (
              <div key={t} className={`border-t pt-2 ${social ? "border-dashed border-ink-muted" : "border-ink"}`}>
                <h3>
                  <SourceTypeBadge type={t} />
                </h3>
                <ul className="mt-2 space-y-1.5">
                  {byType.get(t)!.map((p) => (
                    <li key={p} className="flex gap-2 font-serif text-[15px] leading-snug text-ink">
                      <span className="mt-2 size-1 shrink-0 bg-ink-muted" aria-hidden />
                      {p}
                    </li>
                  ))}
                </ul>
                {social && (
                  <p className="mt-2 flex items-start gap-1.5 font-sans text-[11px] leading-snug text-terracotta">
                    <span aria-hidden>⚠</span>
                    Circulating online; not independently reported.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
