// What Sources Are Emphasizing (§16). Always tied to a named story.
// Reusable: the homepage can render it for the Featured Story.
import { CoverageBar, Icon, SourceTypeBadge } from "@/components/ui";
import { SOURCE_TYPE_COLORS, SOURCE_TYPE_IDS, type SourceTypeId } from "@/lib/taxonomy";
import type { Emphasis } from "@/lib/types";

export function SourceEmphasis({
  storyTitle,
  byType,
  emphasis,
  id,
  columnsClass = "sm:grid-cols-2 xl:grid-cols-3",
}: {
  storyTitle: string;
  byType: Partial<Record<SourceTypeId, number>>;
  emphasis: Emphasis[];
  id?: string;
  columnsClass?: string;
}) {
  // Only types present in this story, in the canonical order.
  const cols = SOURCE_TYPE_IDS.map((t) => emphasis.find((e) => e.sourceType === t)).filter(
    (e): e is Emphasis => !!e && e.points.length > 0,
  );
  return (
    <section id={id} aria-labelledby={id ? `${id}-title` : undefined} className="scroll-mt-4">
      <header className="section-head mb-4">
        <h2 id={id ? `${id}-title` : undefined} className="kicker mt-2 text-ink">
          What sources are emphasizing
        </h2>
        <p className="mt-1 font-serif text-[15px] italic text-ink-soft">On: &ldquo;{storyTitle}&rdquo;</p>
      </header>
      <CoverageBar byType={byType} className="mb-5" />
      {cols.length === 0 ? (
        <p className="meta">Emphasis has not been summarized for this story yet.</p>
      ) : (
        <div className={`grid gap-x-6 gap-y-5 ${columnsClass}`}>
          {cols.map((e) => {
            const social = e.sourceType === "social";
            return (
              <div
                key={e.sourceType}
                className={`border-t-2 pt-2 ${social ? "bg-paper-deep/60 px-3 pb-3" : ""}`}
                style={{ borderColor: SOURCE_TYPE_COLORS[e.sourceType] }}
              >
                <SourceTypeBadge type={e.sourceType} className="text-ink" />
                {social && (
                  <p className="mt-1.5 flex items-start gap-1.5 font-sans text-xs font-medium text-terracotta">
                    <Icon name="alert" size={14} className="mt-px shrink-0" />
                    Circulating online; not independently reported.
                  </p>
                )}
                <ul className="mt-2 space-y-1">
                  {e.points.map((p) => (
                    <li key={p} className="flex gap-2 font-serif text-[15px] leading-snug text-ink">
                      <span className="text-ink-muted" aria-hidden>
                        •
                      </span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
      <p className="meta mt-4">Descriptive summaries of what each group of sources focuses on — not a judgment of who is right.</p>
    </section>
  );
}
