import Link from "next/link";
import { editionDate } from "@/lib/format";
import { Icon } from "@/components/ui";

/** Newspaper masthead (§12). Brand is always the full "ALUNSINA NEWS" — never an acronym. */
export function Masthead() {
  return (
    <div className="mx-auto max-w-[1280px] px-4 md:px-6">
      <div className="grid grid-cols-[1fr_auto] items-center gap-2 pt-3 pb-3 md:grid-cols-[1fr_auto_1fr] md:gap-4 md:pt-6">
        <div className="hidden font-sans text-[10px] font-semibold uppercase leading-[1.5] tracking-[0.16em] text-ink-soft md:block">
          <div>Philippines</div>
          <div>Daily Edition</div>
          <div className="text-ink">{editionDate()}</div>
        </div>
        
        <div className="min-w-0 text-left md:text-center">
          <Link href="/" className="block" aria-label="ALUNSINA NEWS — home">
            <span className="block font-serif whitespace-nowrap text-[32px] font-semibold leading-none tracking-[-0.02em] text-forest-dark sm:text-5xl md:text-[64px]">
              ALUNSINA NEWS
            </span>
          </Link>
          <p className="mt-2 hidden font-sans text-[10px] font-semibold uppercase tracking-[0.32em] text-ink-muted sm:block">
            Analyze · Sources · Insights · Navigate
          </p>
          <p className="mt-1 font-sans text-[11px] italic text-ink-soft md:hidden">{editionDate()}</p>
        </div>
        <div className="flex items-center justify-end gap-1 text-ink-soft md:gap-2">
          <HeaderButton href="/search" icon="search" label="Search" />
          <HeaderButton href="/settings#language" icon="globe" label="Language" className="hidden md:inline-flex" />
          <HeaderButton href="/settings#notifications" icon="bell" label="Notifications" className="hidden md:inline-flex" />
          <HeaderButton href="/settings" icon="user" label="Profile" className="hidden md:inline-flex" />
        </div>
      </div>
    </div>
  );
}

function HeaderButton({ href, icon, label, className = "" }: { href: string; icon: "search" | "globe" | "bell" | "user"; label: string; className?: string }) {
  return (
    <Link href={href} className={`${className || "inline-flex"} size-9 items-center justify-center hover:text-ink`} aria-label={label} title={label}>
      <Icon name={icon} size={19} />
    </Link>
  );
}
