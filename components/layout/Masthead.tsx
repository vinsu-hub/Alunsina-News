import Link from "next/link";
import { editionDate } from "@/lib/format";
import { Icon } from "@/components/ui";
import { Emblem } from "@/components/ui/Emblem";
export function Masthead() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 md:px-6">
      <div className="relative grid items-center gap-4 py-5 lg:grid-cols-[1fr_1.3fr_1fr] lg:py-6">
        <p className="hidden self-start pt-2 text-[9px] uppercase tracking-wider lg:block">
          Philippines · Daily edition · {editionDate()}
        </p>
        <div className="text-center">
          <Emblem className="mx-auto mb-2 text-forest" />
          <Link
            href="/"
            aria-label="ALUNSINA NEWS — home"
            className="block whitespace-nowrap font-serif text-[35px] font-semibold leading-none tracking-tight text-forest-dark sm:text-[52px]"
          >
            ALUNSINA NEWS
          </Link>
          <p className="mt-1 font-serif text-[16px]">
            Truth has more than one source.
          </p>
          <p className="font-serif text-sm italic text-ink-soft">
            More context. A clearer picture.
          </p>
        </div>
        <div className="flex min-w-0 items-center justify-center gap-3 lg:justify-end">
          <form
            action="/search"
            className="flex min-w-0 flex-1 items-center gap-2 rounded-[2px] border border-rule px-2 py-1.5"
          >
            <Icon name="search" size={15} />
            <input
              name="q"
              aria-label="Search stories, topics, or regions"
              placeholder="Search stories, topics, or regions…"
              className="min-w-0 w-full bg-transparent text-[10px] outline-none"
            />
          </form>
          <details className="relative text-xs">
            <summary className="cursor-pointer">EN</summary>
            <div className="absolute right-0 z-20 w-36 border border-rule bg-paper p-3">
              <Link href="/settings#language">Language preferences →</Link>
            </div>
          </details>
          <Link href="/settings#notifications" aria-label="Notifications">
            <Icon name="bell" />
          </Link>
          <Link href="/settings" aria-label="Profile">
            <Icon name="user" />
          </Link>
        </div>
      </div>
    </div>
  );
}
