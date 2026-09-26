import { SOURCE_TYPES, SOURCE_TYPE_COLORS, type SourceTypeId } from "@/lib/taxonomy";

/**
 * Stacked horizontal bar of sources by source type (§16). Built from the
 * source-type taxonomy — not a left/center/right axis.
 */
export function CoverageBar({
  byType,
  showLegend = true,
  height = 10,
  className = "",
}: {
  byType: Partial<Record<SourceTypeId, number>>;
  showLegend?: boolean;
  height?: number;
  className?: string;
}) {
  const entries = SOURCE_TYPES.map((t) => ({ ...t, n: byType[t.id] ?? 0 })).filter((t) => t.n > 0);
  const total = entries.reduce((a, t) => a + t.n, 0);
  if (!total) return null;
  const label = entries.map((t) => `${t.n} ${t.short}`).join(", ");
  return (
    <figure className={className}>
      <div className="flex w-full gap-px bg-paper" style={{ height }} role="img" aria-label={`Sources by type: ${label}`}>
        {entries.map((t) => (
          <div key={t.id} title={`${t.label}: ${t.n}`} style={{ width: `${(t.n / total) * 100}%`, background: SOURCE_TYPE_COLORS[t.id] }} />
        ))}
      </div>
      {showLegend && (
        <figcaption className="mt-2 flex flex-wrap gap-x-3 gap-y-1 meta">
          {entries.map((t, i) => (
            <span key={t.id} className="inline-flex items-center gap-1">
              <span className="size-2" style={{ background: SOURCE_TYPE_COLORS[t.id] }} aria-hidden />
              <span className="font-semibold text-ink tabular-nums">{t.n}</span> {t.short}
              {i < entries.length - 1 && <span className="ml-2 text-rule" aria-hidden>·</span>}
            </span>
          ))}
        </figcaption>
      )}
    </figure>
  );
}
