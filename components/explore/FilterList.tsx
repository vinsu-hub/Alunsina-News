import Link from "next/link";

/** Sidebar filter group built from plain links (no client JS). */
export function FilterList({
  title,
  items,
}: {
  title: string;
  items: { href: string; label: string; count?: number; active: boolean }[];
}) {
  return (
    <nav aria-label={title}>
      <h2 className="kicker border-b border-ink pb-1 text-ink">{title}</h2>
      <ul className="mt-1">
        {items.map((i) => (
          <li key={i.href}>
            <Link
              href={i.href}
              aria-current={i.active ? "true" : undefined}
              className={`flex items-baseline justify-between gap-3 border-b border-rule/60 py-1.5 font-sans text-[13px] ${
                i.active ? "font-semibold text-forest-dark" : "text-ink-soft hover:text-ink"
              }`}
            >
              <span>
                {i.active && <span aria-hidden>▸ </span>}
                {i.label}
              </span>
              {i.count !== undefined && <span className="meta">{i.count}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
