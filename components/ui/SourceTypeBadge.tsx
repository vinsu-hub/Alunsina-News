import { SOURCE_TYPE_COLORS, sourceType, type SourceTypeId } from "@/lib/taxonomy";

/** Square swatch + label. Uses the neutral source-type palette, never political colors. */
export function SourceTypeBadge({ type, short = false, className = "" }: { type: SourceTypeId; short?: boolean; className?: string }) {
  const t = sourceType(type);
  return (
    <span className={`inline-flex items-center gap-1.5 font-sans text-[11px] font-medium uppercase tracking-wide text-ink-soft ${className}`}>
      <span className="size-2 shrink-0" style={{ background: SOURCE_TYPE_COLORS[type] }} aria-hidden />
      {short ? t.short : t.label}
    </span>
  );
}
