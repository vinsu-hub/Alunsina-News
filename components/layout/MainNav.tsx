"use client";
import Link from "next/link";
import { Icon } from "@/components/ui";
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
  return href === "/"
    ? pathname === "/"
    : pathname === href || pathname.startsWith(href + "/");
}

export function MainNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="nav-edge border-y border-ink">
      <div className="mx-auto flex max-w-[1440px] items-center gap-5 px-4 md:px-6">
        <details className="relative shrink-0">
          <summary
            aria-label="Open navigation menu"
            className="cursor-pointer list-none"
          >
            <Icon name="menu" />
          </summary>
          <ul className="absolute left-0 top-8 z-30 w-48 border border-rule bg-paper p-4">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="block py-2 text-sm">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </details>
        <ul className="no-scrollbar flex min-w-0 flex-1 gap-6 overflow-x-auto">
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
                  {active && (
                    <span
                      className="absolute inset-x-0 -bottom-px h-[3px] bg-forest"
                      aria-hidden
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="hidden shrink-0 items-center gap-2 md:flex">
          <Link
            href="#newsletter"
            className="bg-forest px-3 py-2 text-[11px] text-paper"
          >
            Subscribe to briefing
          </Link>
          <Link
            href="/methodology"
            className="border border-forest px-3 py-2 text-[11px] text-forest"
          >
            Methodology
          </Link>
        </div>
      </div>
    </nav>
  );
}
