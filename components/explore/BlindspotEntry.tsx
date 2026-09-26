import Link from "next/link";
import { blindspotType } from "@/lib/taxonomy";
import type { Blindspot } from "@/lib/types";
import { timeAgo } from "@/lib/format";

/** One potential blindspot: type, example, why it was flagged, story link, time. */
export function BlindspotEntry({ b, compact = false }: { b: Blindspot; compact?: boolean }) {
  const t = blindspotType(b.type);
  return (
    <article className="border-t border-rule pt-3">
      <p className="kicker flex flex-wrap items-center gap-x-2 text-terracotta">
        <span>Potential {t.label} Blindspot</span>
        <span className="meta normal-case tracking-normal">
          · Flagged <time dateTime={b.detectedAt}>{timeAgo(b.detectedAt)}</time>
        </span>
      </p>
      <p className={`headline mt-1.5 leading-snug ${compact ? "text-[17px]" : "text-xl"}`}>{b.example}</p>
      <p className={`mt-2 font-sans leading-relaxed text-ink-soft ${compact ? "text-[13px]" : "text-sm"}`}>
        <span className="font-semibold text-ink">Why flagged: </span>
        {b.reason}
      </p>
      <p className="mt-2 font-sans text-[13px]">
        <span className="text-ink-muted">Story: </span>
        <Link href={`/story/${b.storyId}`} className="link-quiet text-ink">
          {b.storyTitle}
        </Link>
      </p>
      {!compact && b.linkHref && b.linkLabel && (
        <p className="mt-1 font-sans text-[13px]">
          <Link href={b.linkHref} className="link-quiet font-semibold text-forest">
            {b.linkLabel} →
          </Link>
        </p>
      )}
    </article>
  );
}
