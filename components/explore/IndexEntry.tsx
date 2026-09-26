import Link from "next/link";
import type { ReactNode } from "react";

/** Broadsheet index line with a dotted leader: "Environment ........ 12". */
export function IndexEntry({
  href,
  label,
  count,
  countLabel,
  sub,
  strong = false,
}: {
  href: string;
  label: ReactNode;
  count?: number;
  countLabel?: string;
  sub?: ReactNode;
  strong?: boolean;
}) {
  return (
    <Link href={href} className="group flex items-baseline gap-2 py-1.5">
      <span className="min-w-0">
        <span
          className={`font-serif decoration-1 underline-offset-4 group-hover:underline ${
            strong ? "text-lg font-semibold text-ink" : "text-[16px] text-ink"
          }`}
        >
          {label}
        </span>
        {sub && <span className="meta ml-1.5">{sub}</span>}
      </span>
      <span className="mb-1 min-w-4 flex-1 border-b border-dotted border-ink-muted/60" aria-hidden />
      {count !== undefined && (
        <span className="font-sans text-sm font-semibold tabular-nums text-ink">
          {count}
          {countLabel && <span className="sr-only"> {countLabel}</span>}
        </span>
      )}
    </Link>
  );
}
