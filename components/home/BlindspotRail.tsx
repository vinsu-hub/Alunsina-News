import Link from "next/link";
import { blindspotType } from "@/lib/taxonomy";
import type { Blindspot } from "@/lib/types";

/** §13 right rail: one live example per blindspot type, each with its reason. Ad-free. */
const VISIBLE = 5;

export function BlindspotRail({ blindspots }: { blindspots: Blindspot[] }) {
  return (
    <section aria-labelledby="blindspots-title">
      <header className="section-head mb-3">
        <div className="mt-2 flex items-baseline justify-between gap-3">
          <h2 id="blindspots-title" className="kicker text-ink">
            Potential Blindspots
          </h2>
          <Link href="/methodology#blindspots" className="meta link-quiet shrink-0">
            Why &lsquo;potential&rsquo;?
          </Link>
        </div>
      </header>
      {blindspots.length === 0 ? (
        <p className="font-serif text-[15px] italic text-ink-soft">No potential blindspots detected in today&apos;s top stories.</p>
      ) : (
        <>
          <ul className="divide-y divide-rule">
            {blindspots.slice(0, VISIBLE).map((b) => (
              <BlindspotItem key={b.id} b={b} />
            ))}
          </ul>
          {blindspots.length > VISIBLE && (
            <details className="group border-t border-rule">
              <summary className="cursor-pointer list-none py-2.5 font-sans text-xs font-semibold text-forest hover:underline underline-offset-4 [&::-webkit-details-marker]:hidden">
                <span className="group-open:hidden">Show {blindspots.length - VISIBLE} more potential blindspots</span>
                <span className="hidden group-open:inline">Show fewer</span>
              </summary>
              <ul className="divide-y divide-rule">
                {blindspots.slice(VISIBLE).map((b) => (
                  <BlindspotItem key={b.id} b={b} />
                ))}
              </ul>
            </details>
          )}
        </>
      )}
    </section>
  );
}

function BlindspotItem({ b }: { b: Blindspot }) {
  return (
    <li className="py-3 first:pt-1">
      <p className="kicker text-terracotta">{blindspotType(b.type).label}</p>
      <p className="headline mt-1 text-[16px] leading-snug">{b.example}</p>
      <p className="mt-1.5 font-sans text-xs leading-relaxed text-ink-muted">
        <span className="font-semibold text-ink-soft">Why flagged:</span> {b.reason}
      </p>
      <p className="meta mt-1.5">
        On:{" "}
        <Link href={`/story/${b.storyId}`} className="link-quiet text-ink-soft">
          {b.storyTitle}
        </Link>
      </p>
      <Link
        href={b.linkHref ?? `/story/${b.storyId}#blindspots`}
        className="mt-1.5 inline-block font-sans text-xs font-semibold text-forest hover:underline underline-offset-4"
      >
        <span aria-hidden>→ </span>
        {b.linkLabel ?? "See the story"}
      </Link>
    </li>
  );
}
