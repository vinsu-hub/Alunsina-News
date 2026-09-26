"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const NAV = [
  { href: "/", label: "Home" },
  { href: "/explore", label: "Explore" },
  { href: "/my-area", label: "My Area" },
  { href: "/topics", label: "Topics" },
  { href: "/regions", label: "Regions" },
  { href: "/sources", label: "Sources" },
  { href: "/blindspots", label: "Blindspots" },
] as const;

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
}

export function MainNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="nav-edge border-y border-ink">
      <ul className="no-scrollbar mx-auto flex max-w-[1280px] justify-start gap-6 overflow-x-auto px-4 md:justify-center md:gap-9 md:px-6">
        {NAV.map((n) => {
          const active = isActive(pathname, n.href);
          return (
            <li key={n.href} className="shrink-0">
              <Link
                href={n.href}
                aria-current={active ? "page" : undefined}
                className={`relative block py-2.5 font-sans text-[13px] font-medium tracking-wide ${
                  active ? "text-forest-dark" : "text-ink-soft hover:text-ink"
                }`}
              >
                {n.label}
                {active && <span className="absolute inset-x-0 -bottom-px h-[3px] bg-forest" aria-hidden />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
