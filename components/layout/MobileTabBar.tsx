"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui";
import { isActive } from "./MainNav";

// Mobile bottom nav (§24). Blindspots lives inside Explore on mobile, not here.
const TABS: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/explore", label: "Explore", icon: "compass" },
  { href: "/my-area", label: "My Area", icon: "pin" },
  { href: "/saved", label: "Saved", icon: "bookmark" },
  { href: "/settings", label: "Profile", icon: "user" },
];

export function MobileTabBar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-ink bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="grid grid-cols-5">
        {TABS.map((t) => {
          const active = isActive(pathname, t.href);
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 py-2 font-sans text-[10px] font-medium ${active ? "text-forest-dark" : "text-ink-muted"}`}
              >
                <Icon name={t.icon} size={20} />
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
