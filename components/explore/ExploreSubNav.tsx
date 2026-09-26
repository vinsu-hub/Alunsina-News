import Link from "next/link";

const ITEMS = [
  { id: "topics", href: "/topics", label: "Topics" },
  { id: "regions", href: "/regions", label: "Regions" },
  { id: "sources", href: "/sources", label: "Sources" },
  { id: "languages", href: "/languages", label: "Languages" },
  { id: "experts", href: "/experts", label: "Experts & Commentary" },
  { id: "blindspots", href: "/blindspots", label: "Blindspots" },
  { id: "saved", href: "/saved", label: "Saved" },
] as const;

export type ExploreSection = (typeof ITEMS)[number]["id"] | "explore";

/** Sticky Explore sub-nav (§19). Scrolls horizontally on narrow screens. */
export function ExploreSubNav({ active = "explore" }: { active?: ExploreSection }) {
  return (
    <nav aria-label="Explore sections" className="sticky top-0 z-30 border-b border-rule bg-paper">
      <ul className="no-scrollbar mx-auto flex max-w-[1280px] items-center gap-5 overflow-x-auto px-4 md:gap-8 md:px-6">
        <li className="shrink-0">
          <Link
            href="/explore"
            aria-current={active === "explore" ? "page" : undefined}
            className={`block py-2.5 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] ${
              active === "explore" ? "text-forest-dark" : "text-ink-muted hover:text-ink"
            }`}
          >
            Explore
          </Link>
        </li>
        <li aria-hidden className="shrink-0 text-rule">
          |
        </li>
        {ITEMS.map((i) => {
          const on = active === i.id;
          return (
            <li key={i.id} className="shrink-0">
              <Link
                href={i.href}
                aria-current={on ? "page" : undefined}
                className={`relative block py-2.5 font-sans text-[13px] font-medium ${
                  on ? "text-forest-dark" : "text-ink-soft hover:text-ink"
                }`}
              >
                {i.label}
                {on && <span className="absolute inset-x-0 -bottom-px h-[2px] bg-forest" aria-hidden />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
